import { Given, When } from '@cucumber/cucumber';
import { disableTour, ensureUserIsLoggedOut } from '../utils/utils';

Given('I am on the home page', async () => {
  await browser.navigateTo('/home');
});

Given('I am on the home page and skipped dialogues', async () => {
  await disableTour();
  await browser.navigateTo('/home');
});

Given('I have accepted cookies', async () => {
  // confirm cookies
  cy.get('app-cookies').find('button.primary-confirm-button').click();
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
