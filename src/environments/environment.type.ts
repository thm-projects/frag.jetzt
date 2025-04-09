export interface EnvironmentType {
  name: 'dev' | 'prod';
  production: boolean;
  stomp_debug: boolean;
  db_migration: 'Trace' | 'Info';
  matomo?: {
    scriptUrl: string;
    trackers?: {
      trackerUrl: string;
      siteId: number;
    }[];
    trackLinks: boolean;
    trackLinkValue?: boolean;
    requireConsent: false | 'consent' | 'cookie-consent';
    skipTrackingInitialPageView: boolean;
  };
}
