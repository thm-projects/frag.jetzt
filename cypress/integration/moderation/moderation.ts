import { When, Then, And } from 'cypress-cucumber-preprocessor/steps';
import { xPathInMenuPanel } from '../utils/angular-utils';

When('I press on the banish icon', () => {
  cy.get('mat-icon').contains('gavel').click();
});

Then('The question should not exist in the QnA', () => {
  cy.get('app-comment').should('not.exist');
});

And('I click on the moderation button', () => {
  xPathInMenuPanel('/div/div/ars-mat-menu-item[3]/button').click();
});

Then('The question should be displayed', () => {
  cy.get('app-comment').should('exist');
});


