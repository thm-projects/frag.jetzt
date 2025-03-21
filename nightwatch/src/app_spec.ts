describe('Sample Example', function () {
  before((browser) => browser.navigateTo('https://nightwatchjs.org/'));

  it('Sample test nightwatchjs.org', function (browser) {
    browser
      .windowSize('current', 1920, 1080)
      .waitForElementVisible('body')
      .assert.titleContains('Nightwatch')
      .assert.visible('.DocSearch-Button')
      .click('.hero__action-copy-command-button')
      .assert.textContains('.hero__action-copy-command-button', 'Copied')
      .assert.textContains('.hero__heading', 'Nightwatch v3');
  });

  after((browser) => browser.end());
});
