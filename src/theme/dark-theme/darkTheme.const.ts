import { ThemeMeta } from '../Theme';

export const dark = {
  '--primary': '#FF8C00',
  '--primary-variant': '#2F4F4F',

  '--secondary': '#8A2BE2',
  '--secondary-variant': '#8A2BE2',

  '--background': '#1F1B24',
  '--surface': '#052338',
  '--dialog': '#15171D',
  '--cancel': '#FF0000',
  '--alt-surface': '#323232',
  '--alt-dialog': '#111217',

  '--on-primary': '#000000',
  '--on-secondary': '#FFFFFF',
  '--on-primary-variant': '#eadabf',
  '--on-background': '#eadabf',
  '--on-surface': '#eadabf',
  '--on-dialog': '#eadabf',
  '--on-cancel': '#000000',

  '--green': 'lawngreen',
  '--red': 'red',
  '--white': '#ffffff',
  '--yellow': 'yellow',
  '--blue': '#3f51b5',
  '--purple': 'blueviolet',
  '--magenta': '#ea0a8e',
  '--light-green': 'lightgreen',
  '--grey': 'slategrey',
  '--grey-light': 'darkgrey',
  '--black': 'black',
  '--moderator': 'black',

  '--questionwall-intro-primary': 'darkorange',
  '--questionwall-intro-secondary': '#eadabf',
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

export const dark_meta: ThemeMeta = {
  translation: {
    name: {
      en: 'Dark mode',
      de: 'Dark Mode',
      fr: 'Mode sombre',
    },
  },
  isDark: true,
  availableOnMobile: true,
  order: 2,
  scale_desktop: 1,
  scale_mobile: 1,
  previewColor: 'background',
  icon: 'nightlight_round',
};
