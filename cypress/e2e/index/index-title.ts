import { Then } from 'cypress-cucumber-preprocessor/steps';

Then('I should see the title', () => {
  cy.get('.main-heading-secondary').should('contain.text', 'frag.jetzt');
});
