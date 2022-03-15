import {And,Then,But} from 'cypress-cucumber-preprocessor/steps';

And('I click on the participant view button', () =>{
  cy.xpath('//*[@id="mat-menu-panel-0"]/div/button[1]').click();
});

Then('The participant view icon should be visible on the top', () =>{
  cy.get('mat-icon').contains('group').should('exist');
});
But('The brainstorming option should not be visible', () =>{
  cy.get('mat-icon').should('not.have.text','tips_and_updates ');
});

