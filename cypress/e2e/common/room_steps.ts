import { Given } from 'cypress-cucumber-preprocessor/steps';
import { disableTour, ensureTestRoomGenerated, mockCreatorTestRoom } from '../utils/utils';
import { xPathInDialog, xPathInMenuPanel, xPathInSnackBar } from '../utils/angular-utils';

Given('I created the room {string}', (roomName) => {
  cy.get('[id=new_session-button]').click();
  cy.get('mat-dialog-container').find('[name=roomName]').type(roomName, { force: true });
  cy.get('mat-dialog-container').find('.primary-confirm-button').click();
});

Given('that the test room will be deleted', () => {
  cy.get('@testRoomData').then(data => {
    cy.visit(data['roomUrl']);
    cy.xpath('//*[@id="session-button"]').click();
    xPathInMenuPanel('/div/div/ars-mat-menu-item[13]/button').click();
    xPathInDialog('/app-room-delete/app-dialog-action-buttons/div/div[1]/div/button[1]').click();
    xPathInSnackBar('/div[1]/simple-snack-bar/span', { timeout: 5_000 }).contains(' deleted.');
  });
});

let data = null;
Given('I created the test room', () => {
  disableTour();
  if (!data) {
    ensureTestRoomGenerated(value => {
      data = value;
      cy.wrap(data).as('testRoomData');
    });
  } else {
    cy.wrap(data).as('testRoomData');
    mockCreatorTestRoom();
    cy.visit(data['roomUrl']);
  }
});
