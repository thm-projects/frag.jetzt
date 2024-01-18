import { ThemeMeta } from '../Theme';

export const system_default = {
  '--previewColor': 'transparent',
  '--on-previewColor': '#fb9a1c',
};

export const system_default_meta: ThemeMeta = {
  order: 3,
  translation: {
    name: {
      en: 'Light | Dark',
      de: 'Hell | Dunkel',
      fr: 'Clair | Foncé',
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
  icon: 'schedule',
  isUtility: true,
};
