/// <reference types="cypress-xpath" />

import {Given, When, Then, And} from 'cypress-cucumber-preprocessor/steps';


Given('I am on the index page', async () => {
  cy.visit('/home');
});
And('I accept the privacy terms', () => {
  cy.get('app-cookies').find('.primary-confirm-button').click();
});
And('I complete the tour guide',() => {
  cy.get('.joyride-step__container').get('joy-close-button').click();
});

When('I do nothing', () => {});

Then('I should see the title', () => {
  cy.get('.main-heading-primary').should('have.text','frag.jetzt');
});
