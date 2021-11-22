# Themes in frag.jetzt

- arsnova-theme.const.ts erweitern
  - importieren sie blue und blue_meta
  - erweitern sie themes mit `blue: blue`
  - erweitern sie themes_meta mit `blue: blue_meta`
- blueTheme.const.ts 
  - blueTheme.consts.ts ist veraltet. Schauen Sie sich die anderen Themes an und ergänzen Sie die Fehlenden Werte
  - Sie können auch den Inhalt eines anderen Themes kopieren
 

# arsnova-theme.const.ts erweitern

## Vorher

```
import { dark, dark_meta } from './dark-theme/darkTheme.const';
import { arsnova, arsnova_meta } from './light-theme/light-theme';
import { purple, purple_meta } from './purple-theme/purpleTheme.const';
import { highcontrast, highcontrast_meta } from './high-contrast-theme/highContrastTheme.const';

export const themes = {
  arsnova: arsnova,
  dark: dark,
  projector: purple,
  highcontrast: highcontrast
};

export const themes_meta = {
  arsnova: arsnova_meta,
  dark: dark_meta,
  projector: purple_meta,
  highcontrast: highcontrast_meta
};

```

## Nachher

```
import { dark, dark_meta } from './dark-theme/darkTheme.const';
import { arsnova, arsnova_meta } from './light-theme/light-theme';
import { purple, purple_meta } from './purple-theme/purpleTheme.const';
import { highcontrast, highcontrast_meta } from './high-contrast-theme/highContrastTheme.const';
import { blue, blue_meta } from './blue-theme/blueTheme.const';

export const themes = {
  arsnova: arsnova,
  dark: dark,
  projector: purple,
  highcontrast: highcontrast,
  blue: blue
};

export const themes_meta = {
  arsnova: arsnova_meta,
  dark: dark_meta,
  projector: purple_meta,
  highcontrast: highcontrast_meta,
  blue: blue_meta
};

```

# blueTheme.consts.ts

blueTheme.consts.ts bestitzt veraltete Werte. Damit es zu keinen Fehlern kommt, können Sie den Inhalt eines anderen Themes kopieren, oder die fehlenden Werte ergänzen.
Geben Sie Ihrem Theme in `blue_meta` einen Namen und eine Beschreibung.

```
export const blue = {

  '--primary' : '#3f51b5',
  '--primary-variant': '#5c6bc0',

  '--secondary': '#ffca28',
  '--secondary-variant': '#fff350',

  '--background': '#fafafa',
  '--surface': '#e0e0e0',
  '--dialog': '#f2f4f5',
  '--cancel': '#9E9E9E',

  '--on-primary': '#FFFFFF',
  '--on-secondary': '#000000',
  '--on-background': '#000000',
  '--on-surface': '#000000',
  '--on-cancel': '#000000',

  '--green': '#4caf50',
  '--red': '#f44336',
  '--yellow': '#FFD54F',
  '--blue': '#3f51b5',
  '--purple': '#9c27b0',
  '--light-green': '#80ba24',
  '--grey': '#BDBDBD',
  '--grey-light': '#EEEEEE',
  '--black': '#212121'
};

export const blue_meta = {

  'translation': {
    'name': {
      'en': 'ENGLISH_NAME',
      'de': 'GERMAN_NAME'
    },
    'description': {
      'en': 'ENGLISH_DESCRIPTION',
      'de': 'GERMAN_DESCRIPTION'
    }
  },
  'isDark': false,
  'order': 4,
  'scale_desktop': 1,
  'scale_mobile': 1,
  'previewColor': 'background'

};


```

# Referenz: darkTheme.consts.ts

```
export const dark = {

  '--primary' : '#bb86fc',
  '--primary-variant': '#616161',

  '--secondary': '#03dac6',
  '--secondary-variant': '#6f74dd',

  '--background': '#121212',
  '--surface': '#212121',
  '--dialog': '#37474f',
  '--cancel': '#26343c',
  '--alt-surface': '#323232',
  '--alt-dialog': '#455a64',

  '--on-primary': '#000000',
  '--on-secondary': '#000000',
  '--on-background': '#FFFFFF',
  '--on-surface': '#FFFFFF',
  '--on-cancel': '#FFFFFF',

  '--green': 'lightgreen',
  '--red': 'red',
  '--yellow': 'yellow',
  '--blue': '#3f51b5',
  '--purple': '#9c27b0',
  '--light-green': '#80ba24',
  '--grey': '#BDBDBD',
  '--grey-light': '#9E9E9E',
  '--black': '#212121',
  '--moderator': '#37474f'
};

export const dark_meta = {

  'translation': {
    'name': {
      'en': 'Dark mode',
      'de': 'Dark Mode'
    },
    'description': {
      'en': 'Dark, battery-saving background',
      'de': 'Dunkler akkuschonender Hintergrund'
    }
  },
  'isDark': true,
  'order': 3,
  'scale_desktop': 1,
  'scale_mobile': 1,
  'previewColor': 'background'

};

```


![](https://i.imgur.com/XrOEQiG.png)
