// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

module.exports = async function(config) {
  const isDocker = (await import('is-docker')).default();
  const isCi = process.env.CI === 'true';

  config.set({
    basePath: '',

    // Use visible Chrome for local development, headless for CI
    browsers: isCi || isDocker ? ['ChromeHeadlessNoSandbox'] : ['Chrome'],

    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-setuid-sandbox']
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
      clearContext: false, // leave Jasmine Spec Runner output visible in browser
      jasmine: {
        random: false, // Run tests in order they are defined
        failFast: false, // Don't stop on first failure
        failSpecWithNoExpectations: true // Fail specs that have no expectations
      },
      // Add debug flag to keep browser open
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

    reporters: ['progress', 'kjhtml', 'coverage-istanbul'],
    reportSlowerThan: 500,
    files: [],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,

    // Force watch mode for local development
    autoWatch: true,
    singleRun: isCi,

    // Increase timeouts for better stability
    browserDisconnectTimeout: 10000,
    browserNoActivityTimeout: 60000,
    captureTimeout: 60000
  });
};
