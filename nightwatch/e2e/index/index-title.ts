import { Then } from "@cucumber/cucumber";

Then('I should see the title', () => {
  cy.get('.main-heading-secondary').should('contain.text', 'frag.jetzt');
});
