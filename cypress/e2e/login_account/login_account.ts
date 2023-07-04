import { And, Then } from 'cypress-cucumber-preprocessor/steps';



Then('I should see the login form', () => {
  cy.get('.cdk-overlay-container').find("app-login").should('exist')
});


And('I should be able to login to my account', () => {

  //to make this locally work, you need to follow the instructions in .env.local file
  cy.get('[aria-labelledby="email-description"]').type(Cypress.env('loginUserMail'))
  cy.get('[aria-labelledby="password-description"]').type(Cypress.env('loginUserPassword'))

  //intercept request to simulate a valid API response (this is opötional, the test will also pass without intercept)
  cy.intercept('POST', '/api/auth/login/registered').as('login_request')
  cy.get('button.login').click()
  cy.wait("@login_request")

  //check if redirect to /user page worked after login
  cy.url().should('include', '/user')
});
