// karma.conf.js - cross-platform browser path resolution for local and CI testing
//
// This configuration auto-detects Chrome and Firefox binaries across macOS, Linux, and Windows.
// It assigns CHROME_BIN and FIREFOX_BIN accordingly and gives visible console feedback.
// In CI environments, it only uses Chrome to avoid missing binary issues.
// Locally, it uses visible Chrome by default and enables full debugging support.

const fs = require('fs');
const path = require('path');

// Utility: Return the first available binary path from a list
function resolveBrowserPath(candidates) {
  return candidates.find((p) => fs.existsSync(p));
}

const platform = process.platform;
let chromeResolved = false;
let firefoxResolved = false;

// === macOS Binary Resolution ===
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

// === Linux Binary Resolution ===
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

// === Windows Binary Resolution ===
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

// === Warnings only – no CI abortion ===
if (!chromeResolved) {
  console.warn(`\x1b[33m[Karma Config] WARN:\x1b[0m No valid Chrome/Chromium browser path found. Please set CHROME_BIN manually.`);
}
if (!firefoxResolved) {
  console.warn(`\x1b[33m[Karma Config] WARN:\x1b[0m No valid Firefox browser path found. Please set FIREFOX_BIN manually.`);
}

module.exports = async function (config) {
  const isDocker = (await import('is-docker')).default();
  const isCi = process.env.CI === 'true';

  config.set({
    basePath: '',

    // === Browser strategy ===
    // In CI and Docker: use Chrome only (Firefox optional, not enforced)
    // Locally: use visible Chrome
    browsers: isCi || isDocker
      ? ['ChromeHeadlessNoSandbox']
      : ['Chrome'],

    // Custom headless launchers with safe defaults
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
      require('karma-jasmine-html-reporter'),
      require('karma-coverage-istanbul-reporter'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],

    // Jasmine & Karma UI behavior
    client: {
      clearContext: false, // preserves Jasmine output in browser
      jasmine: {
        random: false,
        failFast: false,
        failSpecWithNoExpectations: true
      },
      debug: true
    },

    // === Reporting strategy ===
    // Dots in terminal, HTML in browser, coverage for Sonar
    reporters: ['dots', 'kjhtml', 'coverage-istanbul'],
    logLevel: config.LOG_WARN, // suppresses info/debug output

    // === Code coverage output (Sonar-compatible) ===
    coverageIstanbulReporter: {
      dir: path.join(__dirname, 'coverage'),
      subdir: '.', // ensures coverage/lcov.info is flat
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
