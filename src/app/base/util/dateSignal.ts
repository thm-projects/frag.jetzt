import rawI18n from './dateSignal.i18n.json';
import { I18nLoader } from '../i18n/i18n-loader';
import { computed, Signal } from '@angular/core';
import { language } from '../language/language';
import { BehaviorSubject, finalize, map, Observable } from 'rxjs';
import { i18nContext } from '../i18n/i18n-context';
import { TimeoutHelper } from 'app/utils/ts-utils';
const i18n = I18nLoader.load(rawI18n);

export interface FormattedDate {
  date: string;
  time: string;
}

export const getActualDate = (date: Date): Signal<FormattedDate> => {
  date = new Date(date);
  return computed(() => {
    const lang = language();
    return {
      date: date.toLocaleDateString(lang, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }),
      time: date.toLocaleTimeString(lang, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    };
  });
};

const getMonthDiff = (
  current: Date,
  date: Date,
): { monthDiff: number; timeDiff: number } => {
  let monthDiff =
    current.getMonth() -
    date.getMonth() +
    (current.getFullYear() - date.getFullYear()) * 12;
  const tempDate = new Date(date);
  tempDate.setMonth(date.getMonth() + monthDiff);
  if (tempDate > current) {
    monthDiff--;
  } else {
    tempDate.setMonth(tempDate.getMonth() + 1);
  }
  const timeDiff = tempDate.getTime() - current.getTime();
  return {
    monthDiff,
    timeDiff,
  };
};

const NOW_THRESHOLD = 15_000; // 15 seconds, should be between 5 - 30 seconds
const MAX_VALUE = Math.pow(2, 31) - 1;

// must be called in effect
export const getRelativeDate = (date: Date): Observable<string> => {
  const text = i18n();
  date = new Date(date);
  const timeSubject = new BehaviorSubject<void>(undefined);
  let id: TimeoutHelper;
  const schedule = (t: number) => {
    console.assert(t >= 0, 'DateSignal: Time should be positive');
    if (t > MAX_VALUE) {
      t = MAX_VALUE;
    }
    clearTimeout(id);
    id = setTimeout(() => timeSubject.next(), t);
  };
  return timeSubject.pipe(
    map(() => {
      const current = new Date();
      const diff = current.getTime() - date.getTime();
      const oneMinute = 60_000;
      const oneHour = oneMinute * 60;
      const oneDay = oneHour * 24;
      if (diff < NOW_THRESHOLD) {
        schedule(NOW_THRESHOLD - diff);
        return text.now;
      } else if (diff < oneMinute) {
        schedule(oneMinute - diff);
        return text.fewSeconds;
      } else if (diff < oneMinute * 2) {
        schedule(oneMinute * 2 - diff);
        return text.oneMinute;
      } else if (diff < oneMinute * 60) {
        schedule(oneMinute - (diff % oneMinute));
        return i18nContext(text.minute, {
          num: String(Math.floor(diff / oneMinute)),
        });
      } else if (diff < oneHour * 2) {
        schedule(oneHour * 2 - diff);
        return text.oneHour;
      } else if (diff < oneDay) {
        schedule(oneHour - (diff % oneHour));
        return i18nContext(text.hour, {
          num: String(Math.floor(diff / oneHour)),
        });
      } else if (diff < oneDay * 2) {
        schedule(oneDay * 2 - diff);
        return text.oneDay;
      } else if (diff < oneDay * 3) {
        schedule(oneDay * 3 - diff);
        return text.twoDays;
      }
      // check months
      const { monthDiff, timeDiff } = getMonthDiff(current, date);
      if (monthDiff < 1) {
        schedule(oneDay - (diff % oneDay));
        return i18nContext(text.day, {
          num: String(Math.floor(diff / oneDay)),
        });
      } else if (monthDiff < 2) {
        schedule(timeDiff);
        return text.oneMonth;
      } else if (monthDiff < 12) {
        schedule(timeDiff);
        return i18nContext(text.month, {
          num: String(monthDiff),
        });
      } else if (monthDiff < 24) {
        schedule(timeDiff);
        return text.oneYear;
      }
      return i18nContext(text.year, {
        num: String(Math.floor(monthDiff / 12)),
      });
    }),
    finalize(() => clearTimeout(id)),
  );
};
