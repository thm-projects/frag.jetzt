// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

module.exports = async function(config) {
  const isDocker = await import('is-docker');
  
  // First, detect CI environment
  const isCi = process.env.CI === 'true';
  
  config.set({
    basePath: '',
    browsers: ['ChromeHeadlessCustom'],
    customLaunchers: {
      ChromeHeadlessCustom: {
        base: 'ChromeHeadless',
        flags: isDocker.default() ? ['--no-sandbox'] : []
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
        failFast: false // Don't stop on first failure
      }
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
    autoWatch: true,
    singleRun: false,
    
    // Add reasonable timeouts for CI environments
    browserDisconnectTimeout: 10000,
    browserNoActivityTimeout: 60000,
    captureTimeout: 60000
  });

  // Only add Chrome for local development
  if (!isCi) {
    config.browsers.push('Chrome');
  }
};
