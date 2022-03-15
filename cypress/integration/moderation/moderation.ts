import {When,Then,And} from 'cypress-cucumber-preprocessor/steps';

When('I press on the banish icon',() =>{
  cy.get('mat-icon').contains('gavel').click();
});
Then('The question should not exist in the QnA',() =>{
  cy.get('app-comment').should('not.exist');
});
And('I click on the moderation button',() =>{
  cy.xpath('//*[@id="mat-menu-panel-0"]/div/div/ars-mat-menu-item[3]/button').click();
});
Then('The question should be displayed',() =>{
  cy.get('app-comment').should('exist');
});


