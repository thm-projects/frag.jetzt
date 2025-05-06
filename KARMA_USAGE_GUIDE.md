# Karma Test Guide (Team Reference)

## 📚 Contents

- [🧪 Basic Usage](#-basic-usage)
- [🔍 Where to Find Coverage Report](#-where-to-find-coverage-report)
- [🧠 Platform Detection Summary (in config)](#-platform-detection-summary-in-config)
- [🔧 Optional NPM Scripts](#-optional-npm-scripts)
- [⚙️ Recommended Minimal Terminal Output](#-recommended-minimal-terminal-output)
- [📦 Required Dev Dependencies](#-required-dev-dependencies)

This guide summarizes how to run tests locally using different browsers and configurations, based on the shared `karma.conf.js` setup.

---

## 🧪 Basic Usage

| Purpose                       | Command                                      |
| ----------------------------- | -------------------------------------------- |
| Run tests in visible Chrome   | `ng test`                                    |
| Run tests for a component     | `ng test --include=/src/app/components/ ...` |
| Run tests in visible Firefox  | `ng test --browsers=Firefox`                 |
| Run tests in Chrome Headless  | `ng test --browsers=ChromeHeadlessNoSandbox` |
| Run tests in Firefox Headless | `ng test --browsers=FirefoxHeadless`         |
| Run both Chrome & Firefox     | `ng test --browsers=Chrome,Firefox`          |

---

## 🔍 Where to Find Coverage Report

After running tests, Karma generates a code coverage report in:

```
./coverage/index.html
```

To view it:

- Navigate to the file in your file browser and open it in any web browser.
- No need for CLI automation unless preferred.

---

## 🧠 Platform Detection Summary (in config)

The `karma.conf.js` automatically detects the system and sets the proper browser binary:

| Platform | Browser Path Examples  |
| -------- | ---------------------- |
| macOS    | `/Applications/...`    |
| Linux    | `/usr/bin/...`         |
| Windows  | `C:/Program Files/...` |

If a browser binary is not found, Karma will log a warning, and CI will abort the run with an error.

---

## 🔧 Optional NPM Scripts

To simplify usage, you may define scripts in `package.json`:

```json
{
  "scripts": {
    "test": "ng test --watch=false --browsers=ChromeHeadlessNoSandbox --source-map=false --code-coverage",
    "test:firefox": "ng test --browsers=Firefox",
    "test:headless": "ng test --browsers=ChromeHeadlessNoSandbox,FirefoxHeadless"
  }
}
```

Then use:

```bash
npm run test:firefox
```

---

## ⚙️ Recommended Minimal Terminal Output

To reduce noise in terminal logs while preserving browser UI:

In `karma.conf.js`, ensure these lines are set:

```js
reporters: ["dots", "kjhtml", "coverage-istanbul"]; // minimal terminal output with browser UI,
logLevel: config.LOG_WARN; // suppress info/debug, keep warnings,
```

This will:

- show compact progress output (dots) in the terminal,
- keep the browser Jasmine UI visible,
- suppress verbose system info and debug logs.

Avoid setting `reporters: ['dots']` alone, as this will result in a blank browser window.

---

## 📦 Required Dev Dependencies

These are the minimal required packages to run the test setup described above:

| Package                            | Purpose                                    | Install Command                                           |
| ---------------------------------- | ------------------------------------------ | --------------------------------------------------------- |
| `karma`                            | The core test runner                       | `npm install --save-dev karma`                            |
| `@angular-devkit/build-angular`    | Angular CLI builder integration with Karma | Already included in Angular CLI projects                  |
| `karma-jasmine`                    | Jasmine test framework adapter             | `npm install --save-dev karma-jasmine`                    |
| `karma-chrome-launcher`            | Runs tests in Chrome/Chromium              | `npm install --save-dev karma-chrome-launcher`            |
| `karma-firefox-launcher`           | Runs tests in Firefox                      | `npm install --save-dev karma-firefox-launcher`           |
| `karma-jasmine-html-reporter`      | Displays Jasmine results in browser        | `npm install --save-dev karma-jasmine-html-reporter`      |
| `karma-coverage-istanbul-reporter` | Generates HTML/LCOV coverage output        | `npm install --save-dev karma-coverage-istanbul-reporter` |

> Note: If your team only uses Chrome or only Firefox, you may skip the corresponding launcher.

---

For any issues: check terminal logs – the configuration gives clear, color-coded messages.
