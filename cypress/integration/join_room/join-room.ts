/// <reference types="cypress-xpath" />

import {Given, When, Then, And} from 'cypress-cucumber-preprocessor/steps';
import { expect } from 'chai';
import {timeout} from "rxjs";

let name = '';
let id = '';

Given('I am on the home page', async () => {
  cy.visit('/home');
  And('I accept the privacy terms', () => {
    cy.xpath(
      `/html/body/div[2]/div[2]/div/mat-dialog-container/app-cookies/div/app-dialog-action-buttons/div/div[1]/div/button[1]`
    ).click();
  });
  And('I complete the tour guide', () => {
    cy.xpath(
      `/html/body/joyride-step/div/div/joy-close-button`
    ).click();
  });
});
And('The room {string} exists', (roomName) =>{
  name = roomName;
  cy.visit('/home');
  cy.get('[id=new_session-button]').click();
  cy.get('mat-dialog-container').find('[name=roomName]').type(roomName,{force: true});
  cy.get('mat-dialog-container').find('.primary-confirm-button').click();
  cy.wait(30000);
  cy.get('span.room-short-id').then(($span)=>{
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
