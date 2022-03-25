import { When, Then, And } from 'cypress-cucumber-preprocessor/steps';
import { xPathInDialog, xPathInMenuPanel, xPathInSnackBar } from '../utils/angular-utils';

let question = '';


When('I click on the ask a question button', () => {
  cy.xpath('//*[@id="scroll_container"]/div/main/app-comment-page/div/div/app-comment-list/button[2]').click();
});

And('I write {string} in the dialog', (questionText) => {
  question = questionText;
  cy.get('div.ql-editor').then((el) => {
    el[0].textContent = questionText;
  });
});

And('I press the send button', () => {
  cy.get('app-submit-comment').find('button.primary-confirm-button').click();
});

Then('I should see the same question', () => {
  cy.get('app-comment').find('p').should(`contain`, question);
});

When('I click on the icon wrapper', () => {
  cy.xpath('//app-comment[1]/mat-card/div[3]/div[1]/button[3]/span[1]/mat-icon', { timeout: 5000 }).click();
});

And('I click on the delete icon', () => {
  cy.get('mat-icon').contains('delete').click();
});

And('I confirm the dialog', () => {
  xPathInDialog('/app-delete-comment/app-dialog-action-buttons/div/div[1]/div/button[1]').click();
});

Then('The question should be deleted', () => {
  xPathInSnackBar('/div[1]/simple-snack-bar/span', { timeout: 8_000 })
    .should('have.text', 'The contribution has been deleted.');
});

And('I press the edit icon', () => {
  cy.xpath('//app-room-creator-page/div[1]/mat-card/mat-card-header/div/mat-card-title/button').click();
});

And('I remove the current name', () => {
  xPathInDialog('/app-room-name-settings/div[1]/mat-form-field/div/div[1]/div/input').clear({
    force: true,
    timeout: 6_000,
  });
});

And('I write {string}', (newName) => {
  xPathInDialog('/app-room-name-settings/div[1]/mat-form-field/div/div[1]/div/input').type(newName, {
    force: true,
  });
});

And('I press the save button', () => {
  xPathInDialog('/app-room-name-settings/app-dialog-action-buttons/div/div[1]/div/button[1]').click();
});
And('The room name should be {string}', (newName) => {
  cy.xpath('//app-room-creator-page/div[1]/mat-card/mat-card-header/div/mat-card-title/h2')
    .should('have.text', '»' + newName + '«');
});

And('I click on delete room inside the panel', () => {
  xPathInMenuPanel('/div/div/ars-mat-menu-item[13]/button').click();
});

And('I confirm to delete the room', () => {
  xPathInDialog('/app-room-delete/app-dialog-action-buttons/div/div[1]/div/button[1]').click();
  xPathInSnackBar('/div[1]/simple-snack-bar/span', { timeout: 5_000 })
    .should('have.text', 'Test deleted.');
});

And('I click on the sessions inside the panel', () => {
  xPathInMenuPanel('/div/button[1]').click();
});

Then('The room should not exist', () => {
  cy.xpath('//*[@id="scroll_container"]/div/main/app-user-home/div/div[3]/app-room-list/div[1]/div/div[2]/table/tbody/tr')
    .should('not.exist');
});
And('I click on the sessions button inside the panel', () => {
  xPathInMenuPanel('/div/button[3]').click();
});
And('I click on the icon wrapper of the room', () => {
  cy.xpath('//*[@id="scroll_container"]/div/main/app-user-home/div/div[3]' +
    '/app-room-list/div[1]/div/div[2]/table/tbody/tr/td[5]/button').click();
});
And('I click on delete the room', () => {
  cy.get('mat-icon').contains('delete').click();
});
And('I confirm the deletion', () => {
  xPathInDialog('/app-remove-from-history/div/app-dialog-action-buttons/div/div[1]/div/button[1]').click();
});
