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
    routeTracking: {
      enable: true,
    },
    trackLinks: true,
    requireConsent: false,
    requireCookieConsent: false,
    skipTrackingInitialPageView: false,
  },
};
