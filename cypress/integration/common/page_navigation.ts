import {And, Given, When} from 'cypress-cucumber-preprocessor/steps';

Given('I am on the home page', () => {
  cy.visit('/home');
});

Given('I am on the home page and skipped dialogues', async () => {
  cy.visit('/home');
  cy.xpath(`/html/body/div[2]/div[2]/div/mat-dialog-container/app-cookies/div/app-dialog-action-buttons/div/div[1]/div/button[1]`)
    .click();
  cy.xpath(`/html/body/joyride-step/div/div/joy-close-button`).click();
});
And('I go to the QnA', () =>{
  cy.xpath('//*[@id="question_answer-button2"]/span[1]/mat-icon').click();
});
When('I click the back button', () => {
  cy.get('#back-button').click();
});
And('I click on the menu panel',() => {
  cy.xpath('//*[@id="session-button"]').click();
});
