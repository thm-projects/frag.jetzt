import { defineConfig } from 'cypress';
import * as dotenv from 'dotenv';

//init dotenv with .env.test
dotenv.config({ path: __dirname+'/.env.test' })
//override dotenv with values from .env
dotenv.config({ path: __dirname+'/.env', override: true })

export default defineConfig({
  videosFolder: 'cypress/videos',
  screenshotsFolder: 'cypress/screenshots',
  fixturesFolder: 'cypress/fixtures',
  video: false,
  screenshotOnRunFailure: false,
  env: {
    loginUserMail: process.env.TEST_USER_MAIL,
    loginUserPassword: process.env.TEST_USER_PASSWORD,
    preparedRoomId: process.env.TEST_ROOM_SHORTID,
  },
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents: (on, config) => {
      return require('./cypress/plugins/index.ts')(on, config);
    },
    baseUrl: 'http://localhost:4200',
    specPattern: 'cypress/e2e/**/*.{feature,features}'
  },
});
