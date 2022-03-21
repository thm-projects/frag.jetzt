import { Given } from 'cypress-cucumber-preprocessor/steps';

Given('I created the room {string}', (roomName) => {
  cy.get('[id=new_session-button]').click();
  cy.get('mat-dialog-container').find('[name=roomName]').type(roomName, { force: true });
  cy.get('mat-dialog-container').find('.primary-confirm-button').click();
});
