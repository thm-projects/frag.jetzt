import { And, Then, When } from 'cypress-cucumber-preprocessor/steps';


Then('I should see the login form', () => {
  cy.get('.cdk-overlay-container').find("app-login").should('exist')
});


And('I should be able to create a new user', () => {
  cy.get('a.registerBtn').click()
  cy.get('[aria-labelledby="register-email-description"]').type("cypress_test@localhost.de")
  cy.get('[aria-labelledby="register-email-description-repeat"]').type("cypress_test@localhost.de")
  cy.get('[aria-labelledby="register-password-description"]').type("osXR0BObhf3_")
  cy.get('[aria-labelledby="register-password-description-repeat"]').type("osXR0BObhf3_")

  //intercept request to simulate a valid API response (this is optional, the test will also pass without intercept)
  cy.intercept('POST', '/api/user/register', (req) => {
    req.reply({
      statusCode: 200,
      body: {
      },
    })
  }).as('registerRequest')

  cy.get('button.primary-confirm-button').click()

  //wait till async request is finished
  cy.wait('@registerRequest')
  //check for confirmation message
  cy.get('.mat-simple-snack-bar-content').should('contain.text','Successfully registered. Please check your mailbox (possibly even in spam folder)! The dispatch can take up to 10min.')

  //if there is a way to get the activiation key from email, this test could be extended
});
