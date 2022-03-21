import { When, Then, And } from 'cypress-cucumber-preprocessor/steps';

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
  cy.xpath('//*[@id="comment-card"]/div[3]/div[1]/button[3]/span[1]/mat-icon', { timeout: 5000 }).click();
});

And('I click on the delete icon', () => {
  cy.get('mat-icon').contains('delete').click();
});
And('I confirm the dialog', () => {
  cy.xpath('//*[@id="mat-dialog-3"]/app-delete-comment/app-dialog-action-buttons/div/div[1]/div/button[1]').click();
});
Then('The question should not exist', () => {
  cy.get('#comment-card').should('not.exist');
});
And('I press the edit icon', () => {
  cy.xpath('//*[@id="scroll_container"]/div/main/app-room-creator-page' +
    '/div[1]/div/mat-card/div[1]/mat-card-header/div/mat-card-title/button')
    .click();
});
And('I remove the current name', () => {
  cy.xpath('//*[@id="mat-input-2"]').clear({
    force: true,
    timeout: 6_000,
  });
});
And('I write {string}', (newName) => {
  cy.xpath('//*[@id="mat-input-2"]').type(newName, {
    force: true,
  });
});
And('I press the save button', () => {
  cy.xpath('//*[@id="mat-dialog-2"]/app-room-name-settings/app-dialog-action-buttons/div/div[1]/div/button[1]').click();
});
And('The room name should be {string}', (newName) => {
  cy.xpath('//*[@id="scroll_container"]/div/main/app-room-creator-page' +
    '/div[1]/div/mat-card/div[1]/mat-card-header/div/mat-card-title/h2')
    .should('have.text', '»' + newName + '«');
});
And('I click on delete room inside the panel', () => {
  cy.xpath('//*[@id="mat-menu-panel-0"]/div/div/ars-mat-menu-item[13]/button').click();
});
And('I confirm to delete the room', () => {
  cy.xpath('//*[@id="mat-dialog-2"]/app-room-delete/app-dialog-action-buttons/div/div[1]/div/button[1]').click();
  cy.wait(4000);
});
And('I click on the sessions inside the panel', () => {
  cy.xpath('//*[@id="mat-menu-panel-0"]/div/button[1]').click();
});
Then('The room should not exist', () => {
  cy.xpath('//*[@id="scroll_container"]/div/main/app-user-home/div/div[3]/app-room-list/div[1]/div/div[2]/table/tbody/tr')
    .should('not.exist');
});
And('I click on the sessions button inside the panel', () => {
  cy.xpath('//*[@id="mat-menu-panel-0"]/div/button[3]').click();
});
And('I click on the icon wrapper of the room', () => {
  cy.xpath('//*[@id="scroll_container"]/div/main/app-user-home/div/div[3]' +
    '/app-room-list/div[1]/div/div[2]/table/tbody/tr/td[5]/button').click();
});
And('I click on delete the room', () => {
  cy.get('mat-icon').contains('delete').click();
});
And('I confirm the deletion', () => {
  cy.xpath('//*[@id="mat-dialog-2"]/app-remove-from-history/div/app-dialog-action-buttons/div/div[1]/div/button[1]').click();
});
