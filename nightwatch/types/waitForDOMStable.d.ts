import 'nightwatch';

declare module 'nightwatch' {
  interface NightwatchBrowser {
    waitForDOMStable(idleTime?: number, maxWait?: number, callback?: (string) => void): NightwatchBrowser;
  }
}