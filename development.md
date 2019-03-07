# ARSnova lite development

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.7.2.

## Prerequisite

Clone the repository and setup git.
You also need the arsnova-backend running in version 3+ (`master` branch).

Install all dependencies with `npm install`.

## CI Pipeline

In order to guarantee code quality a [linter ](https://palantir.github.io/tslint/).
You can check your code locally with: `node_modules/tslint/bin/tslint -p ./tsconfig.json -c ./tslint.json --project`.

## Development server

Run `npm start` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Wiki

For further project documentation, see [Wiki](https://git.thm.de/arsnova/arsnova-lite/wikis/home)
