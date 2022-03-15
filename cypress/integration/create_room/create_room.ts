import { When, Then, And} from 'cypress-cucumber-preprocessor/steps';

When('I click on create a room', () => {
  cy.get('[id=new_session-button]').click();
});

And('I enter the name {string} in the dialog',(roomName) =>{
  cy.get('mat-dialog-container').find('[name=roomName]').type(roomName,{force: true});
});
And('I click on create room in the dialog',() =>{
  cy.get('mat-dialog-container').find('.primary-confirm-button').click();
});

Then('I will navigate to the creator page', () => {
  cy.url({timeout: 10000}).should('include','/creator/room/');
});
And('The same name {string} is displayed on the page',(roomName) =>{
  cy.get('mat-card-title').find('h2').should('contain',roomName);
});
And('The displayed code is part of the navigation',() =>{
  cy.get('span.room-short-id').then(($span)=>{
    const id = $span.text().replace('Code: ','').trim();
    cy.url().should('include','/creator/room/'+id);
  });
});
