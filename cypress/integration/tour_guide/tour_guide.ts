import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';

Given('I am on the home page', () => {
  cy.visit('/home');
});

When('I accept the privacy terms', () => {
  cy.get('app-cookies').find('.primary-confirm-button').click();
});

Then('the tour guide pops up', () => {
  cy.get('div.joyride-step__container').should('be.visible');
});

Given('the tour guide is visible', () => {
  cy.visit('/home');
  cy.get('app-cookies').find('.primary-confirm-button').click();
});

When('I click on the X button', () => {
  cy.get('joy-close-button.joyride-step__close').click();
});

When('I press the ESC-button', () => {
  cy.get('body').trigger('keyup', { keyCode: 27 });
});

Then('the tour guide should close', () => {
  cy.get('div.joyride-step__container').should('not.exist');
});
