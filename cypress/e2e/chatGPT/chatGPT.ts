import { And, Then, When, Given } from "cypress-cucumber-preprocessor/steps";

Given("I am on the overview of a prepared room", () => {
  cy.visit('/user')
  cy.wait(1000)
  // the shortId of the prepared room comes from the .env file
  // NOTICE: the room needs to be created in your local environment to make this test work locally
  cy.get('#session_id-input').type(Cypress.env('preparedRoomId'));
  cy.get('#session_enter-button').click();
  cy.wait(1500)
  cy.url().should('include', '/participant/room/' + Cypress.env('preparedRoomId') + '/comments')
});

When('I open the chatGPT assistent', () => {
  cy.get('button.mat-button-base').contains('Chat with ChatGPT').click()
  cy.wait(1000)
  cy.url().should('include', '/participant/room/' + Cypress.env('preparedRoomId') + '/gpt-chat-room')

  cy.get('app-gpt-optin-privacy').find('button.secondary-btn').click()
});


// Change to unique id instead of placeholder
Then('I ask the assistent a prepared prompt', () => {
  cy.wait(500)
  cy.get('input[data-placeholder="Select language model …"]').click()
  cy.get('mat-option[ng-reflect-value="gpt-3.5-turbo"]').last().click()
  cy.get('mat-form-field').find('mat-icon').contains('search').type('Linux-Terminal')
  cy.wait(500)
  cy.get('mat-option.ng-star-inserted[ng-reflect-value="Linux-Terminal"]').last().click()
  cy.get('button.secondary-btn').contains('Send').click()
});

And('The assistent should answer the prompt', () => {
  cy.intercept('POST', 'api/gpt/interrupt-stream').as('streamInterrupt')

  //wait till AI-Answered (max 100 seconds)
  cy.wait('@streamInterrupt', { timeout: 100000 }).then((res) => {
    cy.get('div.gpt.ng-star-inserted').find('p').then($el => {
      //check if Answer of AI has at least a length of 10
      expect($el.text()).have.length.above(3)
    })
  });
});


And('I should be able to assume the answer to the QnA forum of the room', () => {
    cy.get('div.gpt.ng-star-inserted').find('button.gpt-paste-btn').click()
    cy.wait(500)
    const spacyDialog = cy.find('app-spacy-dialog');
    if (spacyDialog.length > 0) {
      spacyDialog.find('button.primary-confirm-button').click()
    }
    cy.get('app-gptrating-dialog').find('button.primary-confirm-button').click()
    cy.wait(500)
    cy.url().should('include', '/participant/room/' + Cypress.env('preparedRoomId') + '/comment')
});

When('I am asking the question {string} on the forum', (question) => {
  cy.wait(1000)
  cy.get('button[aria-labelledby="add"]').click();
  cy.get('div[quill-editor-element]').type(question)
  cy.get('app-write-comment').find('button.primary-confirm-button').click();
  cy.wait(500)

  cy.intercept('POST', '/api/comment').as('createQuestion')
  cy.get('app-spacy-dialog').find('button.primary-confirm-button').click();
  cy.wait('@createQuestion')
  cy.url().should('include', '/participant/room/' + Cypress.env('preparedRoomId') + '/comments')
  cy.get('app-view-comment-data p').first().should('contain.text', question)
})


Then('ChatGPT can let reply on it', () => {
  cy.get('app-comment').first().find('mat-icon.chatgpt-robot-icon').click();
  cy.wait(1000)
  cy.url().should('include', '/participant/room/' + Cypress.env('preparedRoomId') + '/gpt-chat-room')

  cy.get('input[data-placeholder="Select language model …"]').click()
  cy.get('mat-option[ng-reflect-value="gpt-3.5-turbo"]').last().click()

  cy.get('mat-select[ng-reflect-panel-class="gpt-chat-room-select"]').first().click()
  cy.wait(500)
  cy.get('div.mat-select-panel-wrap').find('mat-option').first().click()
  cy.wait(500)
  cy.wait(500)
  cy.intercept('POST', 'api/gpt/interrupt-stream').as('streamAnswerInterrupt')

  cy.get('div.ng-star-inserted').find('span.mat-button-wrapper').contains(" Send ").click()
  //wait till AI-Answered (max 100 seconds)
  cy.wait('@streamAnswerInterrupt', { timeout: 100000 }).then((res) => {
    cy.get('div.gpt.ng-star-inserted').find('p').then($el => {
      //check if Answer of AI has at least a length of 10
      expect($el.text()).have.length.above(3)
    })
  });
})
