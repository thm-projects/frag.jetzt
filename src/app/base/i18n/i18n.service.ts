import { HttpClient } from '@angular/common/http';
import {
  Injectable,
  Signal,
  WritableSignal,
  computed,
  signal,
} from '@angular/core';
import { ReplaySubject, catchError, map, of, switchMap } from 'rxjs';

import commonI18n from './global/common.json';

export const Languages = ['de', 'en', 'fr'] as const;
export type LanguageKey = (typeof Languages)[number];

type IsEquals<T, U> = (<G>() => G extends T ? 1 : 2) extends <
  G,
>() => G extends U ? 1 : 2
  ? true
  : false;

type I18nData = { key: string } & {
  [key in LanguageKey]: Record<string, unknown>;
};

type ValidType<T extends object> = 'de' extends keyof T
  ? 'en' extends keyof T
    ? 'fr' extends keyof T
      ? IsEquals<T['de'], T['en']> extends true
        ? IsEquals<T['de'], T['fr']> extends true
          ? Readonly<T['de']>
          : never
        : never
      : never
    : never
  : never;

type GlobalTypes = typeof commonI18n;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ASSERT_VALID: ValidType<GlobalTypes> extends never ? never : true = true;

interface GlobalWrapper {
  global: ValidType<GlobalTypes>;
}
type I18nSignalType<T extends I18nData> = ValidType<T> & GlobalWrapper;

interface GlobalEntry {
  data: WritableSignal<I18nData[]>;
  signal: Signal<ValidType<GlobalTypes>>;
}

type StringToPath<T extends string, V> = T extends `${infer K}.${infer R}`
  ? { readonly [key in K]: StringToPath<R, V> }
  : { readonly [key in T]: V };

const todoLang = signal<LanguageKey>('en');

class ImportBuilder<T> {
  private signalList: {
    signal: Signal<I18nData>;
    additionalKey?: string;
  }[] = [];
  constructor(private i18nService: I18nService) {}

  append<K extends I18nData>(i18nFile: K): ImportBuilder<ValidType<K> & T> {
    this.signalList.push({
      signal: this.i18nService.getOrRetreiveData(i18nFile),
    });
    return this as ImportBuilder<ValidType<K> & T>;
  }

  appendKeyed<
    K extends I18nData,
    Path extends string,
    Return = StringToPath<Path, ValidType<K>> & T,
  >(i18nFile: K, key: Path): ImportBuilder<Return> {
    this.signalList.push({
      signal: this.i18nService.getOrRetreiveData(i18nFile),
      additionalKey: key,
    });
    return this as unknown as ImportBuilder<Return>;
  }

  build(): Signal<T> {
    return computed(() => {
      const global = this.i18nService.getGlobalI18n();
      const lang = todoLang();
      return this.signalList.reduce(
        (acc, d) => {
          const data = d.signal();
          if (!d.additionalKey) {
            return {
              ...acc,
              ...data[lang],
            };
          }
          const obj = { ...acc };
          const keys = d.additionalKey.split('.');
          keys.slice(0, -1).reduce((acc, key) => {
            if (!acc[key]) {
              acc[key] = {};
            }
            return acc[key];
          }, obj)[keys.slice(-1)[0]] = data[lang];
          return obj;
        },
        {
          global,
        },
      ) as T;
    });
  }
}

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private cachedResults = new Map<string, WritableSignal<I18nData>>();
  private globalI18n = { data: signal([]) } as GlobalEntry;
  private indexedFiles = new ReplaySubject<Set<string>>(1);

  constructor(private httpClient: HttpClient) {
    // calculate global obj
    this.globalI18n.signal = computed(() => {
      const lang = todoLang();
      const globalArray = this.globalI18n.data();
      return globalArray.reduce(
        (acc, d) => ({ ...acc, ...d[lang] }),
        {},
      ) as ValidType<GlobalTypes>;
    });
    // get index file
    this.httpClient
      .get('/assets/i18n/index.txt', {
        responseType: 'text',
      })
      .pipe(
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
        this.indexedFiles.next(d);
        this.indexedFiles.complete();
      });
    // Add global i18n
    this.importGlobal(commonI18n);
  }

  importI18n<T extends I18nData>(i18nFile: T): Signal<I18nSignalType<T>> {
    return this.builder().append(i18nFile).build();
  }

  builder() {
    return new ImportBuilder<GlobalWrapper>(this);
  }

  importGlobal<T extends I18nData>(i18nFile: T): void {
    let len = 0;
    this.globalI18n.data.update((prev) => {
      len = prev.length;
      return [...prev, i18nFile];
    });
    this.retreiveFile(i18nFile).subscribe((d) => {
      this.globalI18n.data.update((prev) => {
        return [...prev.slice(0, len), d, ...prev.slice(len + 1)];
      });
    });
  }

  getOrRetreiveData<T extends I18nData>(i18nFile: T): Signal<T> {
    const data = this.cachedResults.get(i18nFile.key);
    if (data) {
      return data.asReadonly() as Signal<T>;
    }
    const ref = signal(i18nFile);
    this.cachedResults.set(i18nFile.key, ref);
    this.retreiveFile(i18nFile).subscribe((d) => ref.set(d));
    return ref;
  }

  getGlobalI18n(): Signal<ValidType<GlobalTypes>> {
    return this.globalI18n.signal;
  }

  private retreiveFile<T extends I18nData>(i18nData: T) {
    return this.indexedFiles.pipe(
      switchMap((files) => {
        if (!files.has(i18nData.key)) {
          return of();
        }
        return this.httpClient.get(`/assets/i18n/${i18nData.key}.json`);
      }),
      catchError((err) => {
        console.error(err);
        return of();
      }),
      map((e) => {
        if (e['partial']) {
          return i18nData;
        }
        return e as T;
      }),
    );
  }
}
