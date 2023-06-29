import { And, Then, When, Given } from "cypress-cucumber-preprocessor/steps";

Given("I am on the overview of a prepared room", () => {
  cy.visit('/user')
  cy.wait(1000)
  // the shortId of the prepared room comes from the .env file
  // NOTICE: the room needs to be created in your local environment to make this test work locally
  cy.get('#session_id-input').type(Cypress.env('preparedRoomId'));
  cy.get('#session_enter-button').click();
  cy.wait(1500)
  cy.url().should('include', '/participant/room/' + Cypress.env('preparedRoomId') + '/comments')
});

When('I open the chatGPT assistent', () => {
  cy.get('button.mat-button-base').contains('Chat with ChatGPT').click()
  cy.wait(1000)
  cy.url().should('include', '/participant/room/' + Cypress.env('preparedRoomId') + '/gpt-chat-room')

  cy.get('app-gpt-optin-privacy').find('button.secondary-btn').click()
});


// Change to unique id instead of placeholder
Then('I ask the assistent a prepared prompt', () => {
  cy.wait(500)
  cy.get('input[ng-reflect-placeholder="Model selection …"]').click()
  cy.get('mat-option[ng-reflect-value="gpt-3.5-turbo"]').last().click()
  cy.get('mat-form-field').find('mat-icon').contains('search').type('IT-Experte')
  cy.wait(500)
  cy.get('mat-option.ng-star-inserted[ng-reflect-value="IT-Experte"]').last().click()
  cy.get('button.secondary-btn').contains(' Senden ').click()
});

And('The assistent should answer the prompt', () => {
  cy.intercept('POST', 'api/gpt/interrupt-stream').as('streamInterrupt')

  //wait till AI-Answered (max 100 seconds)
  cy.wait('@streamInterrupt', { timeout: 100000 }).then((res) => {
    cy.get('div.gpt.ng-star-inserted').find('p').then($el => {
      //check if Answer of AI has at least a length of 10
      expect($el.text()).have.length.above(10)
    })
  });
});


And('I should be able to assume the answer to the QnA forum of the room', () => {
    cy.get('div.gpt.ng-star-inserted').find('button.gpt-paste-btn').click()
    cy.wait(500)
    cy.get('app-spacy-dialog').find('button.primary-confirm-button').click()
    cy.get('app-gptrating-dialog').find('button.primary-confirm-button').click()
    cy.wait(500)
    cy.url().should('include', '/participant/room/' + Cypress.env('preparedRoomId') + '/comments')
});

