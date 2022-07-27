import { ThemeMeta } from '../Theme';

export const purple = {

  '--primary': '#00324a',
  '--primary-variant': 'white',

  '--secondary': '#ff4500',
  '--secondary-variant': '#80d8ff',

  '--background': 'beige',
  '--surface': 'white',
  '--dialog': 'white',
  '--cancel': 'Firebrick',
  '--alt-surface': '#eeeeee',
  '--alt-dialog': '#eeeeee',

  '--on-primary': 'white',
  '--on-secondary': 'white',
  '--on-primary-variant': 'black',
  '--on-background': 'black',
  '--on-surface': 'black',
  '--on-dialog': 'black',
  '--on-cancel': 'white',

  '--green': 'green',
  '--red': 'red',
  '--white': '#ffffff',
  '--yellow': 'gold',
  '--blue': 'blue',
  '--purple': 'purple',
  '--magenta': '#ea0a8e',
  '--light-green': 'lightgreen',
  '--grey': 'slategrey',
  '--grey-light': 'darkgray',
  '--black': 'black',
  '--moderator': 'lightsalmon',

  '--questionwall-intro-primary':'darkorange',
  '--questionwall-intro-secondary':'#eadabf',
  '--questionwall-intro-background':'#121212'

};

export const purple_meta: ThemeMeta = {

  translation: {
    name: {
      en: 'Presentation',
      de: 'Präsentation',
      fr: 'Présentation',
    },
  },
  isDark: false,
  availableOnMobile: false,
  order: 1,
  scale_desktop: 1.5,
  scale_mobile: 1,
  previewColor: 'background',
  icon: 'co_present'

};
