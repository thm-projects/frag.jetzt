import { computed, Signal } from '@angular/core';
import { language } from 'app/base/language/language';
import { isDark } from 'app/base/theme/theme';
import { M3WindowSizeClass } from 'modules/m3/components/navigation/m3-navigation-types';
import { windowWatcher } from 'modules/navigation/utils/window-watcher';

export type ShowBadgeType = 'appstore' | 'playstore' | 'both' | 'none';

export interface BadgeData {
  alt: string;
  src: string;
}

const isStandalone = (): boolean => {
  return (
    navigator['standalone'] ||
    window.matchMedia('(display-mode: standalone)').matches
  );
};

export const badgeType: Signal<ShowBadgeType> = computed(() => {
  const isDesktop = windowWatcher.windowState() !== M3WindowSizeClass.Compact;
  if (isDesktop) {
    return 'both';
  }
  const isInstalled = isStandalone();
  if (isInstalled) {
    return 'none';
  }
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);
  if (isIOS) {
    return 'appstore';
  }
  return isAndroid ? 'playstore' : 'both';
});

export const getAppStoreBadge = (badgeType: ShowBadgeType): BadgeData => {
  switch (language()) {
    case 'de':
      return {
        alt: 'Lade die App im App Store herunter',
        src:
          isDark() && badgeType === 'appstore'
            ? 'assets/images/appstore_de_white.svg'
            : 'assets/images/appstore_de_black.svg',
      };
    case 'fr':
      return {
        alt: "Télécharge l'application dans l'App Store",
        src:
          isDark() && badgeType === 'appstore'
            ? 'assets/images/appstore_fr_white.svg'
            : 'assets/images/appstore_fr_black.svg',
      };
    default:
      return {
        alt: 'Download on the App Store',
        src:
          isDark() && badgeType === 'appstore'
            ? 'assets/images/appstore_en_white.svg'
            : 'assets/images/appstore_en_black.svg',
      };
  }
};

export const getPlayStoreBadge = (): BadgeData => {
  switch (language()) {
    case 'de':
      return {
        alt: 'Lade die App im Play Store herunter',
        src: 'assets/images/GetItOnGooglePlay_Badge_Web_color_German.png',
      };
    case 'fr':
      return {
        alt: "Télécharge l'application dans l'Play Store",
        src: 'assets/images/GetItOnGooglePlay_Badge_Web_color_French-CA.png',
      };
    default:
      return {
        alt: 'Get it on Google Play',
        src: 'assets/images/GetItOnGooglePlay_Badge_Web_color_English.png',
      };
  }
};

export const googleUrl =
  'https://play.google.com/store/apps/details?id=com.uninow.thm&hl=de';
export const appleUrl =
  'https://apps.apple.com/us/app/thm-app/id1644060104?itscg=30200&itsct=apps_box_badge&mttnsubad=1644060104';
