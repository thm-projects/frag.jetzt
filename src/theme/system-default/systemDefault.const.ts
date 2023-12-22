import { ThemeMeta } from '../Theme';

export const system_default = {
  '--previewColor': 'transparent',
  '--on-previewColor': '#fb9a1c',
};

export const system_default_meta: ThemeMeta = {
  order: 3,
  translation: {
    name: {
      en: 'Light mode | Dark mode',
      de: 'Light mode | Dark mode',
      fr: 'Mode sombre | Mode lumineux',
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
