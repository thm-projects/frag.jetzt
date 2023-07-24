import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';

Given('I am on the home page', () => {
  cy.clearAllSessionStorage()
  cy.clearAllCookies()
  cy.clearAllLocalStorage()
  cy.visit('/home');
  cy.wait(500)
});


Then('the tour guide pops up', () => {
  cy.get('app-ask-onboarding').should('be.visible');
});

Given('the tour guide is visible', () => {
  cy.visit('/home');
  cy.wait(500)
  cy.get('app-ask-onboarding').should('exist')
});


When('I press the skip button', () => {
  cy.get('app-ask-onboarding').find('.cancel-button').click()

});

Then('the tour guide should close', () => {
  cy.get('app-ask-onboarding').should('not.exist');
});

When('I press the accept button', () => {
  cy.get('app-ask-onboarding').find('.primary-confirm-button').click()
});


Then('the tour guide should start', () => {
  const tourGuideContainer = cy.get('div.joyride-step__container');
  tourGuideContainer.should('be.visible');

  // testing guide by following one step
  tourGuideContainer.find('button.joy-primary').click()
  cy.get('.joyride-step__counter-container').should('contain.text', '2')

  // notice: I tried to use loops setting a dynamic amount of steps,
  // but cypress can not handle loops and crashes on runtime.
  // For more information visit the documentation https://docs.cypress.io/guides/core-concepts/introduction-to-cypress#Avoid-loops
  // and check the code below:
  //tourGuideContainer.then(($container) => {
  // while($container.find('button.joy-primary').length === 1) {
  //   cy.get('div.joyride-step__container').find('button.joy-primary').click()
  // }
  //})
});
