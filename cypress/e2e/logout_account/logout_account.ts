import { And, Then, When } from 'cypress-cucumber-preprocessor/steps';


When('I open the session menu', () => {
  cy.get('#session-button').click();
});

Then('I should see the logout button', () => {
  cy.get('.mat-menu-content').contains('logout').should('exist')
});


And('I should be able to logout', () => {
  cy.get('.mat-menu-content').contains('logout').click()

  //check if user is logged out by checking if login-menu exists
  cy.get('#login-button').should('exist')
});
