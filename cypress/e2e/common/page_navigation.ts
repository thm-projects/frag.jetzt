import { And, Given, When } from 'cypress-cucumber-preprocessor/steps';
import { disableTour, ensureUserIsLoggedOut } from "../utils/utils";

Given('I am on the home page', () => {
  cy.visit('/home');
});

Given('I am on the home page and skipped dialogues', async () => {
  disableTour();
  cy.visit('/home');
  //wait till website is ready
  cy.wait(1000)
});

When('I click on the login menu button', () => {
  //open login form
  cy.get('#login-button').click();
});

Given('I am not logged in', async () => {
  ensureUserIsLoggedOut();
});

Given('I am logged in as a guest', async () => {
  ensureUserIsLoggedOut();
  //open login-form
  cy.get('#login-button').click();
  //login as guest
  cy.get('[aria-labelledby="guest-login-description"]').click();
  cy.wait(500);

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
