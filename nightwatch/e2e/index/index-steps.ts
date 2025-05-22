import { Given, When } from "@cucumber/cucumber";

Given('I am on the home page and skipped dialogues', function() {
  return this.browser.url('http://localhost:4200')
    .waitForElementVisible('body');
});

When('I do nothing', function() {
  return; // Empty step
});