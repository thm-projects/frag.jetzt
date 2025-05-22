import { Then } from "@cucumber/cucumber";

Then('I should see the title', function() {
  // Try multiple selectors one after another
  return this.browser
    .waitForElementVisible('body', 5000) // First ensure the page is loaded
    .pause(1000) // Give Angular time to render
    .verify.elementPresent('h1')  // Check if h1 exists
    .verify.elementPresent('.title')  // Check if .title exists
    .assert.textContains('h1, .title', 'frag.jetzt'); // Updated to modern syntax
});
