// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

const isDocker = require('is-docker')();

module.exports = function (config) {
  config.set({
    basePath: '',
    browsers: ['ChromeHeadlessCustom', 'Chrome'],
    customLaunchers: {
      ChromeHeadlessCustom: {
        base: 'ChromeHeadless',
        flags: isDocker ? ['--no-sandbox'] : []
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
    files: [
      // css files
      "node_modules/material-icons/iconfont/material-icons.css",
      "node_modules/prismjs/themes/prism-okaidia.css",
      "node_modules/prismjs/plugins/line-highlight/prism-line-highlight.css",
      "node_modules/prismjs/plugins/line-numbers/prism-line-numbers.css",
      "node_modules/quill/dist/quill.core.css",
      "node_modules/quill/dist/quill.bubble.css",
      "node_modules/quill/dist/quill.snow.css",
      "node_modules/quill-emoji/dist/quill-emoji.css",
      // scripts
      "node_modules/marked/lib/marked.js",
      "node_modules/emoji-toolkit/lib/js/joypixels.min.js",
      "node_modules/prismjs/prism.js",
      "node_modules/prismjs/components/prism-csharp.min.js",
      "node_modules/prismjs/components/prism-css.min.js",
      "node_modules/prismjs/plugins/line-highlight/prism-line-highlight.js",
      "node_modules/prismjs/plugins/line-numbers/prism-line-numbers.js",
      "node_modules/katex/dist/katex.min.js",
      "node_modules/quill/dist/quill.js",
      "node_modules/quill-image-resize-module/image-resize.min.js"
    ],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    singleRun: false
  });
};
