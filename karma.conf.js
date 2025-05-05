// karma.conf.js – Cross-platform setup with CI-ready Chrome-only fallback
//
// ✔ Dynamische Browserpfaderkennung für macOS, Linux, Windows
// ✔ Im CI nur Chrome (headless, sandboxfrei)
// ✔ Testabdeckung direkt im Ordner `coverage/`
// ✔ Minimaler Terminalausstoß + HTML-UI im Browser
// ✔ Warnung bei fehlendem Firefox nur lokal

const fs = require('fs');
const path = require('path');

// Hilfsfunktion zur Auswahl des ersten existierenden Browserpfads
function resolveBrowserPath(candidates) {
  return candidates.find((p) => fs.existsSync(p));
}

const platform = process.platform;
let chromeResolved = false;
let firefoxResolved = false;

// === macOS ===
if (platform === 'darwin') {
  const chromiumPath = resolveBrowserPath([
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ]);
  if (chromiumPath) {
    process.env.CHROME_BIN = chromiumPath;
    chromeResolved = true;
    console.log(`[Karma Config] CHROME_BIN set to: ${chromiumPath}`);
  }

  const firefoxPath = '/Applications/Firefox.app/Contents/MacOS/firefox';
  if (fs.existsSync(firefoxPath)) {
    process.env.FIREFOX_BIN = firefoxPath;
    firefoxResolved = true;
    console.log(`[Karma Config] FIREFOX_BIN set to: ${firefoxPath}`);
  }
}

// === Linux ===
if (platform === 'linux') {
  const chromePath = resolveBrowserPath([
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium'
  ]);
  if (chromePath) {
    process.env.CHROME_BIN = chromePath;
    chromeResolved = true;
    console.log(`[Karma Config] CHROME_BIN set to: ${chromePath}`);
  }

  const firefoxPath = '/usr/bin/firefox';
  if (fs.existsSync(firefoxPath)) {
    process.env.FIREFOX_BIN = firefoxPath;
    firefoxResolved = true;
    console.log(`[Karma Config] FIREFOX_BIN set to: ${firefoxPath}`);
  }
}

// === Windows ===
if (platform === 'win32') {
  const chromePath = resolveBrowserPath([
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
  ]);
  if (chromePath) {
    process.env.CHROME_BIN = chromePath;
    chromeResolved = true;
    console.log(`[Karma Config] CHROME_BIN set to: ${chromePath}`);
  }

  const firefoxPath = resolveBrowserPath([
    'C:/Program Files/Mozilla Firefox/firefox.exe',
    'C:/Program Files (x86)/Mozilla Firefox/firefox.exe'
  ]);
  if (firefoxPath) {
    process.env.FIREFOX_BIN = firefoxPath;
    firefoxResolved = true;
    console.log(`[Karma Config] FIREFOX_BIN set to: ${firefoxPath}`);
  }
}

// Warnung nur außerhalb von CI bei fehlendem Firefox
if (!firefoxResolved && process.env.CI !== 'true') {
  console.warn(`[Karma Config] WARN: No valid Firefox browser path found. Please set FIREFOX_BIN manually.`);
}

module.exports = async function (config) {
  const isDocker = (await import('is-docker')).default();
  const isCi = process.env.CI === 'true';

  config.set({
    basePath: '',

    // Im CI/Docker nur Chrome (headless, ohne Sandbox)
    browsers: isCi || isDocker
      ? ['ChromeHeadlessNoSandbox']
      : ['Chrome'],

    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu', '--disable-setuid-sandbox']
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

    client: {
      clearContext: false, // Browser-UI bleibt nach Tests sichtbar
      jasmine: {
        random: false,
        failFast: false,
        failSpecWithNoExpectations: true
      },
      debug: true
    },

    // Reduzierter Terminalausstoß + HTML-UI + Sonar-kompatible Coverage
    reporters: ['dots', 'kjhtml', 'coverage-istanbul'],
    logLevel: config.LOG_WARN,

    coverageIstanbulReporter: {
      dir: path.join(__dirname, 'coverage'),
      subdir: '.', // lcov.info direkt in ./coverage/
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
