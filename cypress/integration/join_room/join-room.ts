import { When, Then, And } from 'cypress-cucumber-preprocessor/steps';

When('I enter the id of the test room', () => {
  cy.visit('/home');
  cy.xpath(`//*[@id="session_id-input"]`).click();
  cy.get('@testRoomData').then((data) => {
    cy.get('#session_id-input').type(data['roomShortId'], { force: true });
  });

  And('I press the join button', () => {
    cy.xpath(`//*[@id="session_enter-button"]/span[1]/mat-icon`).click();
  });
});

Then('I will navigate to its q&a-page as creator', () => {
  cy.get('@testRoomData').then((data) => {
    cy.location('pathname').should('eq', '/creator/room/' + data['roomShortId'] + '/comments');
  });
});
