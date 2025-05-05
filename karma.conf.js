// karma.conf.js - cross-platform browser path resolution for local and CI testing
// 
// This configuration auto-detects Chrome and Firefox binaries across macOS, Linux, and Windows.
// It assigns CHROME_BIN and FIREFOX_BIN accordingly and gives visible console feedback.
// On CI (or Docker), it fails fast if no valid browser binary is found.
// Locally, it uses visible Chrome by default.

const fs = require('fs');

function resolveBrowserPath(candidates) {
  return candidates.find((p) => fs.existsSync(p));
}

const platform = process.platform;

let chromeResolved = false;
let firefoxResolved = false;

// macOS
if (platform === 'darwin') {
  const chromiumPath = resolveBrowserPath([
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ]);
  if (chromiumPath) {
    process.env.CHROME_BIN = chromiumPath;
    chromeResolved = true;
    console.log(`\x1b[32m[Karma Config]\x1b[0m CHROME_BIN set to: ${chromiumPath}`);
  }

  const firefoxPath = '/Applications/Firefox.app/Contents/MacOS/firefox';
  if (fs.existsSync(firefoxPath)) {
    process.env.FIREFOX_BIN = firefoxPath;
    firefoxResolved = true;
    console.log(`\x1b[32m[Karma Config]\x1b[0m FIREFOX_BIN set to: ${firefoxPath}`);
  }
}

// Linux
if (platform === 'linux') {
  const chromePath = resolveBrowserPath([
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium'
  ]);
  if (chromePath) {
    process.env.CHROME_BIN = chromePath;
    chromeResolved = true;
    console.log(`\x1b[32m[Karma Config]\x1b[0m CHROME_BIN set to: ${chromePath}`);
  }

  const firefoxPath = '/usr/bin/firefox';
  if (fs.existsSync(firefoxPath)) {
    process.env.FIREFOX_BIN = firefoxPath;
    firefoxResolved = true;
    console.log(`\x1b[32m[Karma Config]\x1b[0m FIREFOX_BIN set to: ${firefoxPath}`);
  }
}

// Windows
if (platform === 'win32') {
  const chromePath = resolveBrowserPath([
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
  ]);
  if (chromePath) {
    process.env.CHROME_BIN = chromePath;
    chromeResolved = true;
    console.log(`\x1b[32m[Karma Config]\x1b[0m CHROME_BIN set to: ${chromePath}`);
  }

  const firefoxPath = resolveBrowserPath([
    'C:/Program Files/Mozilla Firefox/firefox.exe',
    'C:/Program Files (x86)/Mozilla Firefox/firefox.exe'
  ]);
  if (firefoxPath) {
    process.env.FIREFOX_BIN = firefoxPath;
    firefoxResolved = true;
    console.log(`\x1b[32m[Karma Config]\x1b[0m FIREFOX_BIN set to: ${firefoxPath}`);
  }
}

// Warn if not resolved
if (!chromeResolved) {
  console.warn(`\x1b[33m[Karma Config] WARN:\x1b[0m No valid Chrome/Chromium browser path found. Please set CHROME_BIN manually.`);
  if (process.env.CI === 'true') throw new Error('CHROME_BIN could not be set. Aborting test in CI.');
}
if (!firefoxResolved) {
  console.warn(`\x1b[33m[Karma Config] WARN:\x1b[0m No valid Firefox browser path found. Please set FIREFOX_BIN manually.`);
  if (process.env.CI === 'true') throw new Error('FIREFOX_BIN could not be set. Aborting test in CI.');
}

module.exports = async function(config) {
  const isDocker = (await import('is-docker')).default();
  const isCi = process.env.CI === 'true';

  config.set({
    basePath: '',

    // Browser selection
    browsers: isCi || isDocker ? ['ChromeHeadlessNoSandbox', 'FirefoxHeadless'] : ['Chrome'],

    // Minimal terminal output with browser UI
    reporters: ['dots', 'kjhtml', 'coverage-istanbul'],

    // Suppress info/debug, keep warnings
    logLevel: config.LOG_WARN,

    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu', '--disable-setuid-sandbox']
      },
      FirefoxHeadless: {
        base: 'Firefox',
        flags: ['-headless']
      }
    },

    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-firefox-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage-istanbul-reporter'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],

    client: {
      clearContext: false,
      jasmine: {
        random: false,
        failFast: false,
        failSpecWithNoExpectations: true
      },
      debug: true
    },

    coverageIstanbulReporter: {
      dir: require('path').join(__dirname, 'coverage'),
      reports: ['html', 'lcovonly', 'text-summary'],
      fixWebpackSourcePaths: true,
      verbose: false,
      thresholds: {
        emitWarning: false,
        each: {
          statements: 0,
          lines: 0,
          branches: 0,
          functions: 0
        }
      }
    },

    reportSlowerThan: 500,
    files: [],
    port: 9876,
    colors: true,
    autoWatch: true,
    singleRun: isCi,
    browserDisconnectTimeout: 10000,
    browserNoActivityTimeout: 60000,
    captureTimeout: 60000
  });
};
