import { ThemeMeta } from '../Theme';

// Dark Solarized (see https://ethanschoonover.com/solarized/)
// Author of Solarized: Ethan Schoonover (MIT License)

export const dark_solarized = {
  '--primary': '#2aa198',

  '--secondary': '#268bd2',

  '--background': '#002b36',
  '--surface': '#073642',
  '--dialog': '#073642',
  '--cancel': '#dc322f',

  '--on-primary': '#ffffff',
  '--on-secondary': '#ffffff',

  '--on-background': '#93a1a1',
  '--on-surface': '#93a1a1',
  '--on-dialog': '#93a1a1',
  '--on-cancel': '#93a1a1',
  '--red': '#dc322f',
  '--white': '#fdf6e3',
  '--yellow': '#b58900',
  '--blue': '#268bd2',
  '--purple': '#6c71c4',
  '--magenta': '#d33682',
  '--light-green': '#859900',
  '--grey': '#839496',
  '--grey-light': '#657b83',
  '--black': '#073642',
};

export const dark_solarized_meta: ThemeMeta = {
  translation: {
    name: {
      en: 'Solarized Dark',
      de: 'Solarized Dark',
      fr: 'Solarized Dark',
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
