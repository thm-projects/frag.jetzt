import {Given, When, Then, And} from 'cypress-cucumber-preprocessor/steps';

let question = '';
let id = '';

Given('I am on the home page', () =>{
  cy.visit('/home');
  cy.get('app-cookies').find('.primary-confirm-button').click();
  cy.get('.joyride-step__container').get('joy-close-button').click();

});
And('I create the room {string}', (roomName) =>{
  cy.get('[id=new_session-button]').click();
  cy.get('mat-dialog-container').find('[name=roomName]').type(roomName,{force: true});
  cy.get('mat-dialog-container').find('.primary-confirm-button').click();
  cy.get('span.room-short-id',{timeout: 5000}).then(($span)=>{
    id = $span.text().replace('Code: ','').trim();
    cy.visit('/home');
  });
});
And('I join this room as creator', () =>{
  cy.get('#session_id-input').type(id,{force: true});
  cy.get('#session_enter-button').click();
});

Given('I do nothing', () =>{});
When('I click on the ask a question button', () =>{
  cy.xpath('//*[@id="scroll_container"]/div/main/app-comment-page/div/div/app-comment-list/button[2]').click();
});
And('I write {string} in the dialog', (questionText) =>{
  cy.get('div.ql-editor').then((el) =>{
    el[0].textContent = questionText;
  });
});
And('I press the send button', () =>{
  cy.get('app-submit-comment').find('button.primary-confirm-button').click();
});
Then('I should see the same question', () =>{
  cy.get('app-comment').find('p').should(`contain`,question);
});
