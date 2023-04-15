import { ThemeMeta } from '../Theme';

export const dark = {
  '--primary': 'darkorange',
  '--primary-variant': 'darkslategrey',

  '--secondary': 'blueviolet',
  '--secondary-variant': 'blueviolet',

  '--background': 'black',
  '--surface': '#052338',
  '--dialog': '#15171D',
  '--cancel': 'red',
  '--alt-surface': '#323232',
  '--alt-dialog': '#111217',

  '--on-primary': '#000000',
  '--on-secondary': 'white',
  '--on-primary-variant': '#eadabf',
  '--on-background': '#eadabf',
  '--on-surface': '#eadabf',
  '--on-dialog': '#eadabf',
  '--on-cancel': 'black',

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

  '--livepoll-vote-foreground': '#FFFFFF',
  '--livepoll-vote-background': '#8a2be2',
  '--livepoll-vote-foreground-hover': '#FFFFFF',
  '--livepoll-vote-background-hover': '#ff0000',
  '--livepoll-vote-foreground-active': '#FFFFFF',
  '--livepoll-vote-background-active': '#ff8c00',
  '--livepoll-vote-foreground-active-hover': '#FFFFFF',
  '--livepoll-vote-background-active-hover': '#ff0000',
  '--livepoll-bar-foreground': '#FFFFFF',
  '--livepoll-bar-background': '#ff8c00',
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
  highlightJsClass: 'pojoaque.css',
};
