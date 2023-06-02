import { dark, dark_meta } from './dark-theme/darkTheme.const';
import {
  dark_solarized,
  dark_solarized_meta,
} from './dark-solarized-theme/darkSolarizedTheme.const';
import { arsnova, arsnova_meta } from './light-theme/light-theme';
import { purple, purple_meta } from './purple-theme/purpleTheme.const';
import {
  highcontrast,
  highcontrast_meta,
} from './high-contrast-theme/highContrastTheme.const';
import {
  system_default,
  system_default_meta,
} from './system-default/systemDefault.const';
import { ThemeMeta } from './Theme';

export const themes = {
  arsnova,
  dark,
  dark_solarized,
  projector: purple,
  highcontrast,
  systemDefault: system_default,
};

export const themes_meta: { [key: string]: ThemeMeta } = {
  arsnova: arsnova_meta,
  dark: dark_meta,
  dark_solarized: dark_solarized_meta,
  projector: purple_meta,
  highcontrast: highcontrast_meta,
  systemDefault: system_default_meta,
};
