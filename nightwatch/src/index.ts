describe('Index Page', () => {
    before(async (browser) => await browser.navigateTo('http://localhost:4200'));

    it('Test for frag.jetzt title', async (browser) => {
        await browser
            .navigateTo('http://localhost:4200')
            .waitForDOMStable()
            .verify.elementPresent('h1')  // Check if h1 exists
            .verify.elementPresent('.title')  // Check if .title exists
            .assert.textContains('h1, .title', 'frag.jetzt'); // Updated to modern syntax
    });
});
