/*
 * How to run E2E tests locally on different operating systems
 * ==========================================================
 *
 * Prerequisites for all platforms:
 * 1. Node.js and npm/bun installed
 * 2. Chrome browser installed
 * 3. Project dependencies installed: `npm install` or `bun install`
 *
 * Installing ChromeDriver:
 *
 * Option 1 (Recommended): Using npm (works on all platforms)
 * ```
 * npm install chromedriver --save-dev
 * ```
 *
 * Option 2: OS-specific installation
 *
 * - macOS:
 *   ```
 *   brew install chromedriver
 *   ```
 *   Note: You might need to allow ChromeDriver in System Settings > Security & Privacy
 *   To fix permission issues: xattr -d com.apple.quarantine $(which chromedriver)
 *
 * - Windows:
 *   ```
 *   npm install chromedriver --save-dev
 *   ```
 *   Or download directly from https://chromedriver.chromium.org/downloads
 *
 * - Linux (Ubuntu/Debian):
 *   ```
 *   sudo apt install chromium-chromedriver
 *   ```
 *
 * Running tests:
 * ```
 * npx nightwatch
 * ```
 * Or using bun:
 * ```
 * bun nightwatch/run_e2e.mjs
 * ```
 *
 * Testing specific features:
 * ```
 * npx nightwatch --test nightwatch/e2e/index
 * ```
 *
 * Troubleshooting:
 * 1. ChromeDriver version mismatch: Make sure your ChromeDriver version matches your Chrome browser version
 * 2. Permission issues on macOS: Run: xattr -d com.apple.quarantine $(which chromedriver)
 * 3. Custom ChromeDriver path: Set environment variable: CHROMEDRIVER_PATH=/path/to/chromedriver
 */

//
// Refer to the online docs for more details:
// https://nightwatchjs.org/guide/configuration/nightwatch-configuration-file.html
//
//  _   _  _         _      _                     _          _
// | \ | |(_)       | |    | |                   | |        | |
// |  \| | _   __ _ | |__  | |_ __      __  __ _ | |_   ___ | |__
// | . ` || | / _` || '_ \ | __|\ \ /\ / / / _` || __| / __|| '_ \
// | |\  || || (_| || | | || |_  \ V  V / | (_| || |_ | (__ | | | |
// \_| \_/|_| \__, ||_| |_| \__|  \_/\_/   \__,_| \__| \___||_| |_|
//             __/ |
//            |___/
//

const path = require('path');
const os = require('os');
const fs = require('fs');

// Zentralisiere die CI-Erkennung
const isCI = process.env.CI === 'true' || process.env.GITLAB_CI === 'true';

const server_path = function() {
  if (isCI) {
    // In CI environments (mostly Linux)
    return '/usr/bin/chromedriver';
  }
  
  // Environment variable always takes precedence
  if (process.env.CHROMEDRIVER_PATH) {
    return process.env.CHROMEDRIVER_PATH;
  }
  
  // OS-specific default paths
  const platform = process.platform;
  
  try {
    // Try the npm package first (works on all platforms)
    return require('chromedriver').path;
  } catch (e) {
    // Fallback to OS-specific paths
    if (platform === 'darwin') { // macOS
      return '/opt/homebrew/bin/chromedriver';
    } else if (platform === 'win32') { // Windows
      // Typical Windows installation paths
      return 'C:\\Program Files\\chromedriver\\chromedriver.exe';
    } else { // Linux and others
      // Try common Linux paths, starting with the known working CI path
      if (fs.existsSync('/snap/bin/chromium.chromedriver')) {
        return '/snap/bin/chromium.chromedriver';  // GitLab CI snap installation
      } else if (fs.existsSync('/usr/bin/chromedriver')) {
        return '/usr/bin/chromedriver';  // Standard Linux path
      } else {
        // Final fallback - try typical paths
        return process.env.CHROMEDRIVER_PATH || '/usr/bin/chromedriver';
      }
    }
  }
}();

module.exports = {
  page_objects_path: [],
  custom_commands_path: ['./nightwatch/commands'],
  custom_assertions_path: "",
  plugins: [],
  globals_path: "",

  src_folders: ["nightwatch/src/**/*.ts"],

  webdriver: {
    start_process: true,
    port: 9515,
    server_path: server_path,
  },

  test_workers: {
    enabled: true,
    workers: "auto",
  },

  reporter: function(results, done) {
    const fs = require('fs');
    // Speichere Ergebnisse als JSON für CI-Integration
    if (isCI) {
      fs.writeFileSync('e2e-results.json', JSON.stringify(results, null, 2));
    }
    done();
  },

  test_settings: {
    default: {
      desiredCapabilities: { browserName: "chrome" },
      webdriver: {
        start_process: true,
        server_path: server_path,
      },
      disable_error_log: false,
      launch_url: process.env.TEST_URL || "http://localhost:4200",

      screenshots: {
        enabled: true,
        path: "screens",
        on_failure: true,
      },

      globals: {
        waitForConditionTimeout: 10000,    // Erhöhe Standard-Timeout auf 10s
        retryAssertionTimeout: 5000,       // Wiederhole Assertions für 5s
        asyncHookTimeout: 10000,           // Für Cucumber Hooks
      },
    },

    safari: {
      desiredCapabilities: {
        browserName: "safari",
        alwaysMatch: {
          acceptInsecureCerts: false,
        },
      },
      webdriver: {
        start_process: true,
        server_path: "",
      },
    },

    firefox: {
      desiredCapabilities: {
        browserName: "firefox",
        alwaysMatch: {
          acceptInsecureCerts: true,
          "moz:firefoxOptions": {
            args: [
              // '-headless',
              // '-verbose'
            ],
          },
        },
      },
      webdriver: {
        start_process: true,
        server_path: "",
        cli_args: [
          // very verbose geckodriver logs
          // '-vv'
        ],
      },
    },

    chrome: {
      desiredCapabilities: {
        browserName: "chrome",
        "goog:chromeOptions": {
          // More info on Chromedriver: https://sites.google.com/a/chromium.org/chromedriver/
          //
          // w3c:false tells Chromedriver to run using the legacy JSONWire protocol (not required in Chrome 78)
          w3c: true,
          args: [
            "--no-sandbox",
            "--ignore-certificate-errors",
            "--allow-insecure-localhost",
            // Enable headless mode only in CI
            isCI && "--headless",
            // More debugging options for CI
            isCI && "--disable-gpu",
            isCI && "--window-size=1920,1080"
          ].filter(Boolean),
        },
      },

      webdriver: {
        start_process: true,
        server_path: server_path,
        cli_args: [
          // Verbose logging in CI for better debugging
          isCI && "--verbose"
        ].filter(Boolean),
      },
    },

    edge: {
      desiredCapabilities: {
        browserName: "MicrosoftEdge",
        "ms:edgeOptions": {
          w3c: true,
          // More info on EdgeDriver: https://docs.microsoft.com/en-us/microsoft-edge/webdriver-chromium/capabilities-edge-options
          args: [
            //'--headless'
          ],
        },
      },

      webdriver: {
        start_process: true,
        // Download msedgedriver from https://docs.microsoft.com/en-us/microsoft-edge/webdriver-chromium/
        //  and set the location below:
        server_path: "",
        cli_args: [
          // --verbose
        ],
      },
    },

    //////////////////////////////////////////////////////////////////////////////////
    // Configuration for when using cucumber-js (https://cucumber.io)                |
    //                                                                               |
    // It uses the bundled examples inside the nightwatch examples folder; feel free |
    // to adapt this to your own project needs                                       |
    //////////////////////////////////////////////////////////////////////////////////
    "cucumber-js": {
      src_folders: ["examples/cucumber-js/features/step_definitions"],

      test_runner: {
        // set cucumber as the runner
        type: "cucumber",

        // define cucumber specific options
        options: {
          //set the feature path
          feature_path:
            "node_modules/nightwatch/examples/cucumber-js/*/*.feature",

          // start the webdriver session automatically (enabled by default)
          // auto_start_session: true

          // use parallel execution in Cucumber
          // workers: 2 // set number of workers to use (can also be defined in the cli as --workers=2
        },
      },
    },

    //////////////////////////////////////////////////////////////////////////////////
    // Configuration for when using the browserstack.com cloud service               |
    //                                                                               |
    // Please set the username and access key by setting the environment variables:  |
    // - BROWSERSTACK_USERNAME                                                       |
    // - BROWSERSTACK_ACCESS_KEY                                                     |
    // .env files are supported                                                      |
    //////////////////////////////////////////////////////////////////////////////////
    browserstack: {
      selenium: {
        host: "hub.browserstack.com",
        port: 443,
      },
      // More info on configuring capabilities can be found on:
      // https://www.browserstack.com/automate/capabilities?tag=selenium-4
      desiredCapabilities: {
        "bstack:options": {
          userName: "${BROWSERSTACK_USERNAME}",
          accessKey: "${BROWSERSTACK_ACCESS_KEY}",
        },
      },

      disable_error_log: true,
      webdriver: {
        timeout_options: {
          timeout: 15000,
          retry_attempts: 3,
        },
        keep_alive: true,
        start_process: false,
      },
    },

    "browserstack.local": {
      extends: "browserstack",
      desiredCapabilities: {
        "browserstack.local": true,
      },
    },

    "browserstack.chrome": {
      extends: "browserstack",
      desiredCapabilities: {
        browserName: "chrome",
        chromeOptions: {
          w3c: true,
        },
      },
    },

    "browserstack.firefox": {
      extends: "browserstack",
      desiredCapabilities: {
        browserName: "firefox",
      },
    },

    "browserstack.ie": {
      extends: "browserstack",
      desiredCapabilities: {
        browserName: "internet explorer",
        browserVersion: "11.0",
      },
    },

    "browserstack.safari": {
      extends: "browserstack",
      desiredCapabilities: {
        browserName: "safari",
      },
    },

    "browserstack.local_chrome": {
      extends: "browserstack.local",
      desiredCapabilities: {
        browserName: "chrome",
      },
    },

    "browserstack.local_firefox": {
      extends: "browserstack.local",
      desiredCapabilities: {
        browserName: "firefox",
      },
    },
    //////////////////////////////////////////////////////////////////////////////////
    // Configuration for when using the SauceLabs cloud service                      |
    //                                                                               |
    // Please set the username and access key by setting the environment variables:  |
    // - SAUCE_USERNAME                                                              |
    // - SAUCE_ACCESS_KEY                                                            |
    //////////////////////////////////////////////////////////////////////////////////
    saucelabs: {
      selenium: {
        host: "ondemand.saucelabs.com",
        port: 443,
      },
      // More info on configuring capabilities can be found on:
      // https://docs.saucelabs.com/dev/test-configuration-options/
      desiredCapabilities: {
        "sauce:options": {
          username: "${SAUCE_USERNAME}",
          accessKey: "${SAUCE_ACCESS_KEY}",
          screenResolution: "1280x1024",
          // https://docs.saucelabs.com/dev/cli/sauce-connect-proxy/#--region
          // region: 'us-west-1'
          // https://docs.saucelabs.com/dev/test-configuration-options/#tunnelidentifier
          // parentTunnel: '',
          // tunnelIdentifier: '',
        },
      },
      disable_error_log: false,
      webdriver: {
        start_process: false,
      },
    },
    "saucelabs.chrome": {
      extends: "saucelabs",
      desiredCapabilities: {
        browserName: "chrome",
        browserVersion: "latest",
        javascriptEnabled: true,
        acceptSslCerts: true,
        timeZone: "London",
        chromeOptions: {
          w3c: true,
        },
      },
    },
    "saucelabs.firefox": {
      extends: "saucelabs",
      desiredCapabilities: {
        browserName: "firefox",
        browserVersion: "latest",
        javascriptEnabled: true,
        acceptSslCerts: true,
        timeZone: "London",
      },
    },
    //////////////////////////////////////////////////////////////////////////////////
    // Configuration for when using the Selenium service, either locally or remote,  |
    //  like Selenium Grid                                                           |
    //////////////////////////////////////////////////////////////////////////////////
    selenium_server: {
      // Selenium Server is running locally and is managed by Nightwatch
      // Install the NPM package @nightwatch/selenium-server or download the selenium server jar file from https://github.com/SeleniumHQ/selenium/releases/, e.g.: selenium-server-4.1.1.jar
      selenium: {
        start_process: true,
        port: 4444,
        server_path: "", // Leave empty if @nightwatch/selenium-server is installed
        command: "standalone", // Selenium 4 only
        cli_args: {
          //'webdriver.gecko.driver': '',
          //'webdriver.chrome.driver': ''
        },
      },
      webdriver: {
        start_process: false,
        default_path_prefix: "/wd/hub",
      },
    },

    "selenium.chrome": {
      extends: "selenium_server",
      desiredCapabilities: {
        browserName: "chrome",
        chromeOptions: {
          w3c: true,
        },
      },
    },

    "selenium.firefox": {
      extends: "selenium_server",
      desiredCapabilities: {
        browserName: "firefox",
        "moz:firefoxOptions": {
          args: [
            // '-headless',
            // '-verbose'
          ],
        },
      },
    },
  },
};
