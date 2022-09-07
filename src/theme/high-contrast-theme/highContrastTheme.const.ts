import { ThemeMeta } from '../Theme';

export const highcontrast = {

  '--primary': 'white',
  '--primary-variant': 'DarkSlateGray',

  '--secondary': 'white',
  '--secondary-variant': '#fb9a1c',

  '--background': '#121212',
  '--surface': '#1e1e1e',
  '--dialog': '#000000',
  '--cancel': 'red',
  '--alt-surface': '#323232',
  '--alt-dialog': '#455a64',

  '--on-primary': '#141414',
  '--on-secondary': '#141414',
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
  '--questionwall-intro-background': '#121212'

};

export const highcontrast_meta: ThemeMeta = {

  translation: {
    name: {
      en: 'High contrast',
      de: 'Hoher Kontrast',
      fr: 'Contraste élevé',
    },
  },
  isDark: true,
  availableOnMobile: true,
  order: 0,
  scale_desktop: 1,
  scale_mobile: 1,
  previewColor: 'secondary',
  icon: 'contrast'

};


















