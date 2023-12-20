import {
  dark_solarized,
  dark_solarized_meta,
} from './dark-solarized-theme/darkSolarizedTheme.const';
import { arsnova, arsnova_meta } from './light-theme/light-theme';
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
  highcontrast,
  dark_solarized,
  arsnova,
  systemDefault: system_default,
};

export const themes_meta: { [key: string]: ThemeMeta } = {
  highcontrast: highcontrast_meta,
  dark_solarized: dark_solarized_meta,
  arsnova: arsnova_meta,
  systemDefault: system_default_meta,
};
