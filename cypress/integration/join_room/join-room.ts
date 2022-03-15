import { When, Then, And} from 'cypress-cucumber-preprocessor/steps';


let name = '';
let id = '';


And('The room {string} exists', (roomName) =>{
  name = roomName;
  cy.visit('/home');
  cy.get('[id=new_session-button]').click();
  cy.get('mat-dialog-container').find('[name=roomName]').type(roomName,{force: true});
  cy.get('mat-dialog-container').find('.primary-confirm-button').click();
  cy.get('span.room-short-id',{timeout : 10000}).then(($span)=>{
    id = $span.text().replace('Code: ','').trim();
    cy.visit('/home');
  });
});

When('I enter the id of this room', () => {
  cy.xpath(
    `//*[@id="session_id-input"]`
  ).click();
  cy.get('#session_id-input').type(id,{force: true});

  And('I press the join button', () => {
    cy.xpath(
      `//*[@id="session_enter-button"]/span[1]/mat-icon`
    ).click();
  });
});

Then('I will navigate to its q&a-page as creator', () => {
  cy.location('pathname').should('eq', '/creator/room/'+id+'/comments');
});
