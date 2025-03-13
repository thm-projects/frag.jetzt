import { getInjector } from 'app/base/angular-init';
import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
import { catchError, from, map, of, switchMap } from 'rxjs';
import { NotificationService } from 'app/services/util/notification.service';
const i18n = I18nLoader.load(rawI18n);

export const copyText = (text: string) => {
  return getInjector().pipe(
    switchMap((injector) => {
      const notification = injector.get(NotificationService);
      return from(navigator.clipboard.writeText(text)).pipe(
        map(() => {
          notification.show(i18n().success, undefined, {
            duration: 5_000,
            panelClass: ['snackbar-valid'],
          });
          return true;
        }),
        catchError((e) => {
          console.error(e);
          notification.show(i18n().fail, undefined, {
            duration: 12_500,
            panelClass: ['snackbar-invalid'],
          });
          return of(false);
        }),
      );
    }),
  );
};
