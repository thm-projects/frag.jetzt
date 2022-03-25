import { And, Then, When } from 'cypress-cucumber-preprocessor/steps';
import { xPathInDialog, xPathInMenuPanel, xPathInSnackBar } from '../utils/angular-utils';

And('The question is set with a bonus token', () => {
  cy.xpath('//app-comment[1]/mat-card/div[3]/div[1]/button[3]/span[1]/mat-icon').click();
  xPathInMenuPanel('/div/div/button[1]/span[1]/mat-icon').click();
  xPathInSnackBar('/div[1]/simple-snack-bar/span', { timeout: 8_000 })
    .should('have.text', 'The questioner can redeem the star for a bonus by mail.');
});

When('I click on the menu panel', () => {
  cy.xpath('//*[@id="session-button"]').click();
});

And('I click on the bonus archive icon', () => {
  xPathInMenuPanel('/div/div/ars-mat-menu-item[7]/button').click();
});

Then('The bonus token should be displayed', () => {
  xPathInDialog('/app-bonus-token/div/div/div[2]/div/div[2]/table/tbody/tr', { timeout: 8_000 })
    .should('exist');
});

And('I click on the icon wrapper', () => {
  xPathInDialog('/app-bonus-token/div/div/div[2]/div/div[2]/table/tbody/tr[last()]/td[4]/button').click();
});

And('I go to the question', () => {
  cy.get('mat-icon').contains('article').click();
});

Then('The question should be displayed', () => {
  cy.get('app-comment').should('exist');
});


