import { ReplaySubject, catchError, map, of, switchMap } from 'rxjs';
import { AVAILABLE_LANGUAGES, Language, language } from '../language/language';
import { HttpClient } from '@angular/common/http';
import { Immutable, Mutable } from 'app/utils/ts-utils';
import { Signal, WritableSignal, computed, signal } from '@angular/core';

export type I18nData = { key: string } & {
  [key in Language]: Record<string, unknown>;
};

type IsEquals<T, U> = (<G>() => G extends T ? 1 : 2) extends <
  G,
>() => G extends U ? 1 : 2
  ? true
  : false;

type Checker<
  T extends string,
  RootObj extends Record<T, unknown>,
  LangArr extends T[],
> = LangArr extends [infer First, infer Second, ...infer Rest]
  ? First extends T
    ? Second extends T
      ? IsEquals<RootObj[First], RootObj[Second]> extends true
        ? Rest extends T[]
          ? Checker<T, RootObj, [Second, ...Rest]>
          : never
        : never
      : never
    : never
  : LangArr extends [infer First]
    ? First extends T
      ? RootObj[First]
      : never
    : never;

type ValidType<T> = Language extends keyof T
  ? Immutable<Checker<Language, T, Mutable<typeof AVAILABLE_LANGUAGES>>>
  : false;

// Global
import commonI18n from './global/common.json';

export const globals = [commonI18n] as const;

type Globals<Path extends string> = StringToPath<
  Path,
  ValidType<(typeof globals)[number]>
>;

// Builder
type StringToPath<T extends string, V> = T extends `${infer K}.${infer R}`
  ? { readonly [key in K]: StringToPath<R, V> }
  : { readonly [key in T]: V };

class Builder<T> {
  private signalList: {
    signal: Signal<I18nData>;
    additionalKey?: string;
  }[] = [];
  constructor(private loader: Loader) {}

  append<K extends I18nData, Return = Builder<ValidType<K> & T>>(
    i18nFile: K,
  ): Return {
    this.signalList.push({
      signal: this.loader.register(i18nFile),
    });
    return this as unknown as Return;
  }

  appendKeyed<
    K extends I18nData,
    Path extends string,
    Return = Builder<StringToPath<Path, ValidType<K>> & T>,
  >(i18nFile: K, key: Path): Return {
    this.signalList.push({
      signal: this.loader.register(i18nFile),
      additionalKey: key,
    });
    return this as unknown as Return;
  }

  build(): Signal<T> {
    return computed(() => {
      const lang = language();
      return this.signalList.reduce((acc, d) => {
        const data = d.signal()[lang];
        if (!d.additionalKey) {
          return {
            ...acc,
            ...data,
          };
        }
        const obj = acc;
        const keys = d.additionalKey.split('.');
        keys.slice(0, -1).reduce((acc, key) => {
          if (!acc[key]) {
            acc[key] = {};
          }
          return acc[key];
        }, obj)[keys.slice(-1)[0]] = data;
        return obj;
      }, {}) as T;
    });
  }
}

// Loader
interface LoaderCache {
  [key: string]: WritableSignal<I18nData>;
}

class Loader {
  private client = new ReplaySubject<HttpClient>(1);
  private indexFile = new ReplaySubject<Set<string>>(1);
  private cache: LoaderCache = {};

  constructor() {
    // Get index file
    this.client
      .pipe(
        switchMap((client) =>
          client.get('/assets/i18n/index.txt', {
            responseType: 'text',
          }),
        ),
        catchError((e) => {
          console.error(e);
          return of('');
        }),
        map((txt) => {
          const newSet = new Set<string>();
          for (const line of txt.split('\n')) {
            const filePathName = line.trim();
            if (filePathName.length > 0) {
              newSet.add(filePathName);
            }
          }
          return newSet;
        }),
      )
      .subscribe((d) => {
        this.indexFile.next(d);
        this.indexFile.complete();
      });
  }

  moduleBuilder() {
    return new Builder<unknown>(this);
  }

  builder(): Builder<Globals<'global'>> {
    let builder = this.moduleBuilder();
    for (const global of globals) {
      builder = builder.appendKeyed(global, 'global');
    }
    return builder as Builder<Globals<'global'>>;
  }

  loadModule<T extends I18nData>(data: T): Signal<ValidType<T>> {
    return this.moduleBuilder().append(data).build();
  }

  load<T extends I18nData>(data: T): Signal<ValidType<T> & Globals<'global'>> {
    return this.builder().append(data).build();
  }

  setClient(client: HttpClient) {
    this.client.next(client);
    this.client.complete();
  }

  register<T extends I18nData>(data: T): Signal<T> {
    const current = this.cache[data.key];
    if (current) {
      return current.asReadonly() as Signal<T>;
    }
    const newSignal = signal(data);
    this.cache[data.key] = newSignal;
    this.indexFile
      .pipe(
        switchMap((index) => {
          if (index.has(data.key)) {
            return this.client;
          }
          return of();
        }),
        switchMap((client) => client.get('/assets/i18n/' + data.key + '.json')),
        catchError((e) => {
          console.error(e);
          return of();
        }),
      )
      .subscribe((data) => newSignal.set(data as T));
    return newSignal.asReadonly();
  }
}

export const I18nLoader = new Loader();
