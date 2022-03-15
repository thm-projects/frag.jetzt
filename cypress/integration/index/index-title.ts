import { Then} from 'cypress-cucumber-preprocessor/steps';

Then('I should see the title', () => {
  cy.get('.main-heading-primary').should('have.text','frag.jetzt');
});
