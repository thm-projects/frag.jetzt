import { And, Given, When } from 'cypress-cucumber-preprocessor/steps';
import { xPathInDialog } from '../utils/angular-utils';
import { disableTour } from '../utils/utils';

Given('I am on the home page', () => {
  cy.visit('/home');
});

Given('I am on the home page and skipped dialogues', async () => {
  disableTour();
  cy.visit('/home');
});

And('I go to the QnA', () => {
  cy.xpath('//*[@id="question_answer-button"]/span[1]/mat-icon', { timeout: 8_000 }).click();
});

When('I click the back button', () => {
  cy.get('#back-button').click();
});

And('I click on the menu panel', () => {
  cy.xpath('//*[@id="session-button"]').click();
});

Given('I route to the QnA of the generated Test Room', () => {
  cy.get('@testRoomData').then(data => cy.visit(`${data['roomUrl']}/comments`));
});
