import { And, Then } from 'cypress-cucumber-preprocessor/steps';



Then('I should see the login form', () => {
  cy.get('.cdk-overlay-container').find("app-login").should('exist')
});


And('I should be able to login to my account', () => {

  //TODO you need to fill the credentials of an existing account to make this step work
  cy.get('[aria-labelledby="email-description"]').type("test@test.de")
  cy.get('[aria-labelledby="password-description"]').type("test")

  //intercept request to simulate a valid API response (this is opötional, the test will also pass without intercept)
  cy.intercept('POST', '/api/auth/login/registered').as('login_request')
  cy.get('button.login').click()
  cy.wait("@login_request")

  //check if redirect to /user page worked after login
  cy.url().should('include', '/user')
});
