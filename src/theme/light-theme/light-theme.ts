import { ThemeMeta } from '../Theme';

export const arsnova = {
  '--primary': 'darkblue',
  '--primary-variant': 'blanchedalmond',

  '--secondary': '#1d6161',
  '--secondary-variant': '#1d6161',

  '--background': 'ivory',
  '--surface': 'bisque',
  '--dialog': 'cornsilk',
  '--cancel': 'red',
  '--alt-surface': '#eeeeee',
  '--alt-dialog': 'aliceblue',

  '--on-primary': 'white',
  '--on-secondary': 'white',
  '--on-primary-variant': '#000000',
  '--on-background': '#000000',
  '--on-surface': '#000000',
  '--on-dialog': '#000000',
  '--on-cancel': 'white',

  '--green': 'green',
  '--red': 'red',
  '--white': '#ffffff',
  '--yellow': 'darkorange',
  '--blue': '#002878',
  '--purple': 'purple',
  '--magenta': '#ea0a8e',
  '--light-green': 'lightgreen',
  '--grey': 'slategrey',
  '--grey-light': 'darkgray',
  '--black': '#000000',
  '--moderator': 'lightpink',

  '--questionwall-intro-primary': 'darkorange',
  '--questionwall-intro-secondary': 'white',
  '--questionwall-intro-background': '#121212',

  '--livepoll-primary': '#8a2be2',
  '--livepoll-primary--disabled': '#282934',
  '--livepoll-primary--hover': '#993cf5',
  '--on-livepoll-primary': '#ffffff',
  '--on-livepoll-primary--disabled': '#c5c5c5',
  '--on-livepoll-primary--hover': '#ffffff',

  '--livepoll-secondary': '#ff8e00',
  '--livepoll-secondary--disabled': '#5f5f64',
  '--livepoll-secondary--hover': '#faa24f',
  '--on-livepoll-secondary': '#ffffff',
  '--on-livepoll-secondary--disabled': '#c5c5c5',
  '--on-livepoll-secondary--hover': '#ffffff',
};

export const arsnova_meta: ThemeMeta = {
  translation: {
    name: {
      en: 'Light mode',
      de: 'Light Mode',
      fr: 'Mode lumineux',
    },
  },
  isDark: false,
  availableOnMobile: true,
  order: 3,
  scale_desktop: 1,
  scale_mobile: 1,
  previewColor: 'background',
  icon: 'light',
  highlightJsClass: 'a11y-dark.css',
};
