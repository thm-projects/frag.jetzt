import { And, Given, Then, When } from "cypress-cucumber-preprocessor/steps";

export let roomData = {
  shortId: "",
  name: ""
};

When('I click on the create room button', () => {
  cy.get('#create_session-button').click()
});

Then('The room creation form should be visible', () => {
  cy.get('mat-dialog-container').find('app-room-create').should('be.visible')
  cy.wait(300)
});

And('I should be able to create a new room called {string}', (testRoom) => {
  //fill form
  cy.get('[name="roomName"]').type(testRoom)
  cy.get('mat-slide-toggle').click();

  //intercept async request
  cy.intercept('POST', '/api/room*').as('createRoomRequest')
  cy.get('app-room-create').find('button.primary-confirm-button').click()

  //save response body to global variable (roomData)
  cy.wait('@createRoomRequest').then(({ request, response }) => {
    expect(response.statusCode).to.eq(200)
    expect(response.body).to.be.not.empty
    roomData = response.body
  })
});

Then('I should see the room options', () => {
cy.get('mat-dialog-container').find('app-room-settings-overview').should('be.visible')

});

And('I should be able to save the options', () => {
  cy.get('mat-dialog-container').find('app-room-settings-overview')
  cy.get('mat-dialog-container').find('.primary-confirm-button').click()
  cy.wait(300)
});

Then('I should see the room overview', () => {
  //test if redirect worked by checking the url
  cy.url().should('include', '/creator/room/' + roomData.shortId)
  cy.wait(500)
  //check page content by examining the room title
  cy.get('app-room-creator-page').find('mat-card-title').should('contain.text', roomData.name)
});

// force is needed because there is an element which covers the button
Given('that the test room will be deleted', () => {
    cy.visit('/creator/room/' + roomData.shortId);
    cy.wait(500)
    cy.get('#session-button').click({force: true});
    cy.get('.mat-menu-content').contains('Delete room').click()
    cy.get('app-room-delete').find('button.alert-confirm-button').click()
    cy.wait(500)
    //check if redirect to /user page worked after deletion
    cy.url().should('include', '/user')
});


When('I am on the user page', () => {
  cy.visit('/user')
  cy.wait(1000)
});


Then('I should be able to join a prepared room with a room code', () => {
  // the shortId of the prepared room comes from the .env file
  // NOTICE: the room needs to be created in your local environment to make this test work locally
  cy.get('#session_id-input').type(Cypress.env('preparedRoomId'));
  cy.get('#session_enter-button').click();
  cy.wait(1000)
  cy.url().should('include', '/participant/room/' + Cypress.env('preparedRoomId') + '/comments')
});
