// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

module.exports = async function (config) {
  const isDocker = await import('is-docker');
  config.set({
    basePath: '',
    browsers: ['ChromeHeadlessCustom', 'Chrome'],
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
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    coverageIstanbulReporter: {
      dir: require('path').join(__dirname, 'coverage'),
      reports: ['html', 'lcovonly', 'text-summary'],
      fixWebpackSourcePaths: true,
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
    // Use angular.json for additional files
    files: [],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    singleRun: false
  });
};
