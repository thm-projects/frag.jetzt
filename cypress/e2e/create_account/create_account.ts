import { And, Then, When } from 'cypress-cucumber-preprocessor/steps';


When('I click on the login Button', () => {
  cy.get('#login-button').click();
});

Then('I should see the login form', () => {
  const loginForm = cy.get('.cdk-overlay-container').find("app-login");
  expect(loginForm).to.exist;
});


And('I should be able to create a new user', () => {
  cy.get('a.registerBtn').click()
  cy.get('[aria-labelledby="register-email-description"]').type("cypress_test@localhost.de")
  cy.get('[aria-labelledby="register-email-description-repeat"]').type("cypress_test@localhost.de")
  cy.get('[aria-labelledby="register-password-description"]').type("osXR0BObhf3_")
  cy.get('[aria-labelledby="register-password-description-repeat"]').type("osXR0BObhf3_")
  cy.get('button.primary-confirm-button').click()

  //intercept request to simulate a valid API response (this is optional, the test will also pass without intercept)
  cy.intercept('POST', '/api/user/register', (req) => {
    req.reply({
      statusCode: 200,
      body: {
      },
    })
  })
});
