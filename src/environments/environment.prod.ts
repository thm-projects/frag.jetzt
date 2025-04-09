import { EnvironmentType } from './environment.type';

export const environment = {
  name: 'prod',
  production: true,
  stomp_debug: false,
  db_migration: 'Info',
  matomo: {
    scriptUrl: '/matomo/piwik.js',
    trackers: [
      {
        trackerUrl: '/matomo/',
        siteId: 6,
      },
    ],
    trackLinks: true,
    requireConsent: false,
    skipTrackingInitialPageView: false,
  },
} satisfies EnvironmentType;
