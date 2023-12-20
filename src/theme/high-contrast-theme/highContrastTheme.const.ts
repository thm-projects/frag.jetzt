import { ThemeMeta } from '../Theme';

export const highcontrast = {
  '--primary': 'white',
  '--primary-variant': 'DarkSlateGray',

  '--secondary': 'white',
  '--secondary-variant': 'DarkSlateGray',

  '--background': '#121212',
  '--surface': '#1e1e1e',
  '--dialog': '#000000',
  '--cancel': 'red',
  '--alt-surface': '#323232',
  '--alt-dialog': '#455a64',

  '--on-primary': '#141414',
  '--on-secondary': 'black',
  '--on-primary-variant': '#FFFFFF',
  '--on-background': '#FFFFFF',
  '--on-surface': '#FFFFFF',
  '--on-dialog': '#FFFFFF',
  '--on-cancel': 'black',

  '--green': 'green',
  '--red': 'red',
  '--white': '#ffffff',
  '--yellow': 'yellow',
  '--blue': '#3833e9',
  '--purple': 'purple',
  '--magenta': '#ea0a8e',
  '--light-green': '#33e98d',
  '--grey': 'slategrey',
  '--grey-light': 'darkgray',
  '--black': 'black',
  '--moderator': 'black',

  '--questionwall-intro-primary': 'darkorange',
  '--questionwall-intro-secondary': '#eadabf',
  '--questionwall-intro-background': '#121212',

  '--livepoll-primary': '#3833e9',
  '--livepoll-primary--disabled': '#282934',
  '--livepoll-primary--hover': '#E6E5FC',
  '--on-livepoll-primary': '#ffffff',
  '--on-livepoll-primary--disabled': '#c5c5c5',
  '--on-livepoll-primary--hover': '#282934',

  '--livepoll-secondary': '#ff8e00',
  '--livepoll-secondary--disabled': '#5f5f64',
  '--livepoll-secondary--hover': '#FFF1DF',
  '--on-livepoll-secondary': '#ffffff',
  '--on-livepoll-secondary--disabled': '#c5c5c5',
  '--on-livepoll-secondary--hover': '#282934',
};

export const highcontrast_meta: ThemeMeta = {
  translation: {
    name: {
      en: 'Contrast',
      de: 'Kontrast',
      fr: 'Contraste',
    },
  },
  isDark: true,
  availableOnMobile: true,
  order: 0,
  scale_desktop: 1,
  scale_mobile: 1,
  previewColor: 'background',
  icon: 'contrast',
};
