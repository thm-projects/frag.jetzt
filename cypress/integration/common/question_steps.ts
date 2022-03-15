import {And, Given, When} from 'cypress-cucumber-preprocessor/steps';

Given('I created the question {string}', (questionName) => {
    cy.xpath('//*[@id="scroll_container"]/div/main/app-comment-page/div/div/app-comment-list/button[2]').click();
    cy.get('div.ql-editor').then((el) =>{
      el[0].textContent = questionName;
    });
  cy.get('app-submit-comment',{timeout: 5000}).find('button.primary-confirm-button').click();
  cy.wait(2000);
});

