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

type I18nData = {
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

type I18nSignalType<T extends I18nData> = ValidType<T> & {
  global: ValidType<GlobalTypes>;
};

interface CachedEntry<T extends I18nData> {
  data: WritableSignal<T>;
  signal: Signal<I18nSignalType<T>>;
}

interface GlobalEntry {
  data: WritableSignal<Record<string, unknown>[]>;
  signal: Signal<Record<string, unknown>>;
}

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private cachedResults = new Map<string, CachedEntry<I18nData>>();
  private globalI18n = { data: signal([]) } as GlobalEntry;
  private todoLang = signal<LanguageKey>('en');
  private indexedFiles = new ReplaySubject<Set<string>>(1);

  constructor(private httpClient: HttpClient) {
    // calculate global obj
    this.globalI18n.signal = computed(() => {
      const globalArray = this.globalI18n.data();
      return globalArray.reduce((acc, d) => ({ ...acc, ...d }), {});
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
    this.importGlobal(commonI18n, 'common');
  }

  importI18n<T extends I18nData>(
    i18nFile: T,
    importId: string,
  ): Signal<I18nSignalType<T>> {
    const id = importId;
    return this.getOrRetreiveData(i18nFile, id).signal;
  }

  importGlobal<T extends I18nData>(i18nFile: T, assetName: string): void {
    let len = 0;
    this.globalI18n.data.update((prev) => {
      len = prev.length;
      return [...prev, i18nFile];
    });
    this.retreiveFile(assetName, i18nFile).subscribe((d) => {
      this.globalI18n.data.update((prev) => {
        return [
          ...prev.slice(0, len),
          d as Record<string, unknown>,
          ...prev.slice(len + 1),
        ];
      });
    });
  }

  private getOrRetreiveData<T extends I18nData>(
    i18nFile: T,
    id: string,
  ): CachedEntry<T> {
    const data = this.cachedResults.get(id);
    if (data) {
      return data as CachedEntry<T>;
    }
    const ref = {
      data: signal(i18nFile),
    } as CachedEntry<T>;
    this.retreiveFile(id, i18nFile).subscribe((d) => ref.data.set(d));
    this.makeFinalSignal(ref);
    this.cachedResults.set(id, ref as CachedEntry<I18nData>);
    return ref;
  }

  private makeFinalSignal<T extends I18nData>(ref: CachedEntry<T>) {
    ref.signal = computed(() => {
      const data = ref.data();
      const lang = this.todoLang();
      const global = this.globalI18n.signal() as ValidType<GlobalTypes>;
      return {
        ...(data[lang] as ValidType<T>),
        global,
      };
    });
  }

  private retreiveFile<T extends I18nData>(id: string, i18nData: T) {
    return this.indexedFiles.pipe(
      switchMap((files) => {
        if (!files.has(id)) {
          return of();
        }
        return this.httpClient.get(`/assets/i18n/${id}.json`);
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
