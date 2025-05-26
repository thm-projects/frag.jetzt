exports.command = async function (idleTime = 150, maxWait = 5000, callback) {
  const start = performance.now();
  await this.waitForElementVisible('body', maxWait);
  const nextWait = maxWait - (performance.now() - start);
  await this.executeAsync(async function (idleTime, maxWait, done) {
    await new Promise(resolve => {
      let observer;
      let timeout;
      const resetTimeout = () => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          observer.disconnect();
          done({ value: true });
          resolve();
        }, idleTime);
      };
      setTimeout(() => {
        observer.disconnect();
        done({ value: false });
        resolve();
      }, maxWait);
      resetTimeout();
      observer = new MutationObserver(resetTimeout);
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }, [idleTime, nextWait], function (result) {
    if (callback) callback(result.value);
  });

  return this;
};