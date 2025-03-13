import { language } from 'app/base/language/language';
import { RestrictionTarget } from '../services/assistant-restriction.service';
import { i18nContext } from 'app/base/i18n/i18n-context';

export const transformTarget = (
  i18nUserTargets: Record<string, string>,
  target: RestrictionTarget,
): string => {
  const key = target
    .toLowerCase()
    .replace(/_./g, (match) => match[1].toUpperCase());
  return i18nUserTargets[key];
};

export const transformDate = (date: Date): string => {
  return date.toLocaleDateString(language(), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const transformTime = (date: Date): string => {
  return date.toLocaleTimeString(language(), {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const transformCurrency = (num: number): string => {
  return Intl.NumberFormat(language(), {
    currency: 'USD',
    currencyDisplay: 'symbol',
    minimumIntegerDigits: 1,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: 'currency',
  }).format(num);
};

export interface RepeatStrategy {
  strategy: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  multiplier: number;
}

export const transformRepetiton = (
  i18n: unknown,
  strategy: RepeatStrategy,
): string => {
  if (strategy.multiplier > 1) {
    return i18nContext(i18n['infoMoreRepetition'][strategy.strategy], {
      repetitionMultiplier: String(strategy.multiplier),
    });
  }
  return i18n['repetitionUnits'][strategy.strategy];
};

export const parseRepeatStrategy = (strategy: string): RepeatStrategy => {
  const regex = /^(\d+)(d|w|m|y)$/;
  const match = strategy.match(regex);
  if (!match) {
    return { strategy: 'never', multiplier: 1 };
  }
  let strategyValue: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  switch (match[2]) {
    case 'd':
      strategyValue = 'daily';
      break;
    case 'w':
      strategyValue = 'weekly';
      break;
    case 'm':
      strategyValue = 'monthly';
      break;
    case 'y':
      strategyValue = 'yearly';
      break;
    default:
      strategyValue = 'never';
  }
  return { strategy: strategyValue, multiplier: Number(match[1]) };
};

export const decodeRepeatStrategy = (strategy: RepeatStrategy): string =>
  strategy.multiplier + strategy.strategy[0];
