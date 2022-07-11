import { Given } from 'cypress-cucumber-preprocessor/steps';
import { xPathInSnackBar } from '../utils/angular-utils';

Given('I created the question {string}', (questionName) => {
  cy.xpath('//*[@id="scroll_container"]/div/main/app-comment-page/div/div/app-comment-list/button[2]').click();
  cy.xpath('//app-write-comment//div[contains(@class, "ql-editor")]/p[last()]').type(questionName, { force: true });
  cy.get('app-submit-comment', { timeout: 5_000 }).find('button.primary-confirm-button').click();
  xPathInSnackBar('/div[1]/simple-snack-bar/span', { timeout: 5_000 })
    .should('have.text', 'Your contribution has been published.');
  cy.wait(500);
});

