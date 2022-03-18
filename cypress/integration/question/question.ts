import {But, Given, Then, When, And} from 'cypress-cucumber-preprocessor/steps';

Then('The badge should display the number {string}',(number) =>{
  cy.xpath('//*[@id="mat-badge-content-4"]').should('have.text',number);
});
Given('I set the question to wrong',()=>{
  cy.xpath('//*[@id="comment-card"]/div[3]/div[1]/button[2]').click();
});
When('I mark the question as correct',()=>{
  cy.xpath('//*[@id="comment-card"]/div[3]/div[1]/button[1]').click();
});
Then('The correct icon should be marked',()=>{
  cy.xpath('//*[@id="comment-card"]/div[3]/div[1]/button[1]/span[1]/mat-icon')
    .should('have.class','correct-icon');
});
But('The wrong icon should not be marked',()=>{
  cy.xpath('//*[@id="comment-card"]/div[3]/div[1]/button[2]/span[1]/mat-icon')
    .should('have.class','not-marked');
});
When('I set the bonus token for the question',()=>{
  cy.xpath('//*[@id="comment-card"]/div[3]/div[1]/button[3]/span[1]/mat-icon').click();
  cy.xpath('//*[@id="mat-menu-panel-8"]/div/div/button[1]/span[1]/mat-icon').click();
});
And('I set the bookmark',()=>{
  cy.xpath('//*[@id="comment-card"]/div[3]/div[1]/button[4]/span[1]/mat-icon').click();
  cy.xpath('//*[@id="mat-menu-panel-8"]/div/div/button[1]/span[1]/mat-icon').click();
});
Then('The bonus token should be marked',()=>{
  cy.xpath('//*[@id="comment-card"]/div[3]/div[1]/button[3]/span[1]/mat-icon')
    .should('have.class','favorite-icon');
});
And('the bookmark should be marked',()=>{
  cy.xpath('//*[@id="comment-card"]/div[3]/div[1]/button[4]/span[1]/mat-icon')
    .should('have.class','bookmark-icon');
});
When('I click on the icon wrapper', () =>{
  cy.xpath('//*[@id="comment-card"]/div[3]/div[1]/button[3]/span[1]/mat-icon').click();
});
And('I click on the category icon',()=>{
  cy.get('mat-icon').contains('sell').click();
});
And('I open the category overview',()=>{
  cy.xpath('//*[@id="mat-dialog-3"]/app-edit-comment-tag/mat-dialog-content/button').click();
});
And('I choose a category',()=>{
  cy.xpath('//*[@id="mat-option-19"]').click();
});
And('I save the chosen category',()=>{
  cy.xpath('//*[@id="mat-dialog-3"]/app-edit-comment-tag/ars-row/ars-col[2]/app-dialog-action-buttons/div/div[1]/div/button[1]')
    .click();
});
Then('The category icon should be visible on the question',() =>{
  cy.xpath('//*[@id="comment-card"]/div[3]/div[3]/div/mat-icon').should('exist');
});




