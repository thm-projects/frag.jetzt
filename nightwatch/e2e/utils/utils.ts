export const disableTour = async () => {
  await browser.executeAsync((done) => {
    localStorage.setItem('onboarding_default', '{"state":"finished"}');
    const request = indexedDB.open('frag.jetzt');
    request.onsuccess = () => {
      const db = request.result;
      const trans = db.transaction('config', 'readwrite');
      const config = trans.objectStore('config');
      config.put({
        key: 'cookieAccepted',
        value: true,
      });
      trans.commit();
      db.close();
      done();
    };
  });
};

export const clearDataBase = () => {
  browser.execute(() => indexedDB.deleteDatabase('frag.jetzt'));
};

export const ensureUserIsLoggedOut = function() {
  return this.browser.waitForElementVisible('#options-login-box')
    .execute(function() {
      const container = document.querySelector('#options-login-box');
      return container.querySelector('#login-button') !== null;
    }, [], function(result) {
      // Handle result...
    });
};

export const waitForAngular = () => {
  return browser.executeAsync(function(done) {
    const interval = setInterval(() => {
      if (window.getAllAngularTestabilities) {
        window.getAllAngularTestabilities().forEach(testability => {
          if (testability.isStable()) {
            clearInterval(interval);
            done(true);
          }
        });
      }
    }, 10);
  });
};
