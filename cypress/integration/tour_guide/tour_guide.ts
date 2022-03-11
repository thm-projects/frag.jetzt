import {Given, When, Then, And} from 'cypress-cucumber-preprocessor/steps';import {Given, When, Then, And} from 'cypress-cucumber-preprocessor/steps';

// Scenario 1
Given('I am on the home page', () => {
    cy.visit('/home');
});

When('I accept the privacy terms', () => {
    cy.get('app-cookies').find('.primary-confirm-button').click();
});

Then('the tour guide pops up', () => {
    cy.get('div.joyride-step__container').should('be.visible');
});

// Scenario 2
Given('the tour guide is visible', () => {
    cy.visit('/home');
    cy.get('app-cookies').find('.primary-confirm-button').click();
});

When('I click on the X button', () => {
    cy.get('joy-close-button.joyride-step__close').click();
});

When('I press the ESC-button', () => {
    cy.get('body').trigger('keyup', {keyCode: 27});
});

/*When('I follow the tour guide step by step', () => {
    let splitter;
    let start;
    let end;

    let el = 'div.joyride-step__counter-container';

    cy.get(el).then($element => {
        splitter = $element.text().replace(/\s/g, '').split('/');
        start = parseInt(splitter[0]);
        end = parseInt(splitter[1]);
        steppingThroughGuide();
    });

    let steppingThroughGuide = () => {
        for (let i = start; i <= end; i++) {
            cy.get(el).then($element => {
                let current = parseInt($element.text().replace(/\s/g, '').split('/')[0]);
                assert(current == start + i);
            });
    
            cy.get('button.joy-primary').click();
        }
    }
});*/

Then('the tour guide should close', () => {
    cy.get('div.joyride-step__container').should('not.exist');
});



/*

Given('', () => {

});

When('', () => {

});

Then('', () => {

});

And('', () => {

});

*/