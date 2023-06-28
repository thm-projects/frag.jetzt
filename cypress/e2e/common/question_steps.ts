import { Given } from 'cypress-cucumber-preprocessor/steps';
import { xPathInSnackBar } from '../utils/angular-utils';

Given('I created the question {string}', (questionName) => {
  cy.wait(1000);
  cy.get('button.fab_add_comment').click();
  cy.get('.ql-editor').type(questionName, { force: true });
  cy.get('app-submit-comment', { timeout: 5_000 }).find('button.primary-confirm-button').click();
  cy.get('#mat-dialog-1').find('.primary-confirm-button').click();
  //cy.get('.action-button-container > ars-col > app-dialog-action-buttons > .dialog-action-buttons > [fxlayoutalign="end"] > .buttons > .primary-confirm-button > .mat-button-wrapper')
  cy.wait(500);
  cy.get('.ql-editor > p').should('have.text', questionName);
});

