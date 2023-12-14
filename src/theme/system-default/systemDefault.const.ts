import { ThemeMeta } from '../Theme';

export const system_default = {
  '--previewColor': '#052338',
  '--on-previewColor': '#fb9a1c',
};

export const system_default_meta: ThemeMeta = {
  order: 5,
  translation: {
    name: {
      en: 'Day | Night',
      de: 'Tag | Nacht',
      fr: 'Jour | Nuit',
    },
  },
  isDark: false,
  availableOnMobile: true,
  previewColor: 'previewColor',
  scale_desktop: 1,
  scale_mobile: 1,
  config: {
    light: 'arsnova',
    dark: 'dark_solarized',
  },
  icon: 'settings_suggest',
  isUtility: true,
};
