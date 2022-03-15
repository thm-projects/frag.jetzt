import {And, Given, Then,When} from 'cypress-cucumber-preprocessor/steps';

And('The question is set with a bonus token',() =>{
  cy.xpath('//*[@id="comment-card"]/div[3]/div[1]/button[3]').click();
});
When('I click on the menu panel',() =>{
  cy.xpath('//*[@id="session-button"]').click();
});
And('I click on the bonus archive icon',() =>{
  cy.wait(4000);
  cy.xpath('//*[@id="mat-menu-panel-0"]/div/div/ars-mat-menu-item[7]/button').click();
});
Then('The bonus token should be displayed',() =>{
  cy.xpath('//*[@id="mat-dialog-3"]/app-bonus-token/div/div/div[2]/div/div[2]/table/tbody/tr').should('exist');
});
And('I click on the icon wrapper',() =>{
  cy.xpath('//*[@id="mat-dialog-3"]/app-bonus-token/div/div/div[2]/div/div[2]/table/tbody/tr/td[4]/button').click();
});
And('I go to the question',() =>{
  cy.get('mat-icon').contains('article').click();
});
Then('The question should be displayed',() =>{
  cy.get('app-comment').should('exist');
});


