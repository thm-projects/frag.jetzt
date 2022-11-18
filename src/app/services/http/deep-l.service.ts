import { Injectable } from '@angular/core';
import { BaseHttpService } from './base-http.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map, mergeMap, tap, timeout } from 'rxjs/operators';
import {
  ImmutableStandardDelta,
  QuillUtils,
  StandardDelta,
} from '../../utils/quill-utils';
import { clone } from '../../utils/ts-utils';

/* eslint-disable @typescript-eslint/naming-convention */
const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/x-www-form-urlencoded',
  }),
};

interface DeepLResult {
  translations: {
    detected_source_language: SourceLang;
    text: string;
  }[];
}

export enum SourceLang {
  BG = 'BG',
  CS = 'CS',
  DA = 'DA',
  DE = 'DE',
  EL = 'EL',
  EN = 'EN',
  ES = 'ES',
  ET = 'ET',
  FI = 'FI',
  FR = 'FR',
  HU = 'HU',
  IT = 'IT',
  JA = 'JA',
  LT = 'LT',
  LV = 'LV',
  NL = 'NL',
  PL = 'PL',
  PT = 'PT',
  RO = 'RO',
  RU = 'RU',
  SK = 'SK',
  SL = 'SL',
  SV = 'SV',
  ZH = 'ZH',
}

export enum TargetLang {
  BG = 'BG',
  CS = 'CS',
  DA = 'DA',
  DE = 'DE',
  EL = 'EL',
  EN_GB = 'EN-GB',
  EN_US = 'EN-US',
  ES = 'ES',
  ET = 'ET',
  FI = 'FI',
  FR = 'FR',
  HU = 'HU',
  IT = 'IT',
  JA = 'JA',
  LT = 'LT',
  LV = 'LV',
  NL = 'NL',
  PL = 'PL',
  PT_PT = 'PT-PT',
  PT_BR = 'PT-BR',
  RO = 'RO',
  RU = 'RU',
  SK = 'SK',
  SL = 'SL',
  SV = 'SV',
  ZH = 'ZH',
}

/* eslint-enable @typescript-eslint/naming-convention */

export enum FormalityType {
  Default = '',
  Less = 'less',
  More = 'more',
}

@Injectable({
  providedIn: 'root',
})
export class DeepLService extends BaseHttpService {
  constructor(private http: HttpClient) {
    super();
    this.checkAPIStatus().subscribe({
      next: (hasQuota) => {
        if (!hasQuota) {
          this.setTimeout(86_400_000);
        }
      },
      error: (err) => {
        if (err?.status === 403) {
          this.setTimeout(Number.MAX_SAFE_INTEGER);
        }
      },
    });
  }

  public static transformSourceToTarget(lang: SourceLang): TargetLang {
    switch (lang) {
      case SourceLang.EN:
        return TargetLang.EN_US;
      case SourceLang.PT:
        return TargetLang.PT_PT;
      default:
        return TargetLang[lang];
    }
  }

  public static supportsFormality(lang: TargetLang): boolean {
    switch (lang) {
      case TargetLang.DE:
      case TargetLang.ES:
      case TargetLang.FR:
      case TargetLang.IT:
      case TargetLang.NL:
      case TargetLang.PL:
      case TargetLang.PT_BR:
      case TargetLang.PT_PT:
      case TargetLang.RU:
        return true;
      default:
        return false;
    }
  }

  static removeMarkdown(text: string): string {
    // remove emphasis elements before (*_~), heading (#) and quotation (>)
    return (
      text
        .replace(/([*_~]+(?=[^*_~\s]))|(^[ \t]*#+ )|(^[ \t]*>[> ]*)/gm, '')
        // remove code blocks (`)
        .replace(/(`+)/g, '')
        // remove emphasis elements after (*_~)
        .replace(/([^*_~\s])[*_~]+/gm, '$1')
        // replace links
        .replace(/\[([^\n\[\]]*)\]\(([^()\n]*)\)/gm, '$1 $2')
    );
  }

  private static encodeHTML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private static decodeHTML(str: string): string {
    return str
      // eslint-disable-next-line @typescript-eslint/quotes
      .replace(/&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/&amp;/g, '&');
  }

  improveDelta(
    body: ImmutableStandardDelta,
    targetLang: TargetLang,
    formality: FormalityType,
  ): Observable<[StandardDelta, string]> {
    let isMark = false;
    const skipped = [];
    const newDelta: StandardDelta = clone(body);
    const xml = newDelta.ops.reduce((acc, e, i) => {
      if (typeof e['insert'] !== 'string') {
        skipped.push(i);
        return acc;
      }
      const text = DeepLService.encodeHTML(
        DeepLService.removeMarkdown(e['insert']),
      );
      acc += isMark ? '<x>' + text + '</x>' : text;
      e['insert'] = '';
      isMark = !isMark;
      return acc;
    }, '');
    return this.improveTextStyle(xml, targetLang, formality).pipe(
      map((str) => {
        let index = 0;
        const nextStr = (textStr: string) => {
          while (skipped[0] === index) {
            skipped.splice(0, 1);
            index++;
          }
          if (index >= newDelta.ops.length) {
            return;
          }
          newDelta.ops[index++]['insert'] = DeepLService.decodeHTML(textStr);
        };
        const regex = /<x>([^<]*)<\/x>/g;
        let m;
        let start = 0;
        while ((m = regex.exec(str)) !== null) {
          nextStr(str.substring(start, m.index));
          nextStr(m[1]);
          start = m.index + m[0].length;
        }
        nextStr(str.substring(start));
        return [newDelta, QuillUtils.getTextFromDelta(newDelta)];
      }),
    );
  }

  improveTextStyle(
    text: string,
    temTargetLang: TargetLang,
    formality: FormalityType,
  ): Observable<string> {
    return this.makeXMLTranslateRequest(text, temTargetLang, formality).pipe(
      mergeMap((result) =>
        this.makeXMLTranslateRequest(
          result.translations[0].text,
          DeepLService.transformSourceToTarget(
            result.translations[0].detected_source_language,
          ),
          formality,
        ),
      ),
      map((result) => result.translations[0].text),
    );
  }

  private checkAPIStatus(): Observable<boolean> {
    const url = '/deepl/usage';
    return this.http.post<any>(url, '', httpOptions).pipe(
      tap((_) => ''),
      timeout(1500),
      map((obj) => obj.character_count < obj.character_limit),
      catchError(this.handleError<any>('checkAPIStatus')),
    );
  }

  private makeXMLTranslateRequest(
    text: string,
    targetLang: TargetLang,
    formality: FormalityType,
  ): Observable<DeepLResult> {
    const url = '/deepl/translate';
    const tagFormality =
      DeepLService.supportsFormality(targetLang) &&
      formality !== FormalityType.Default
        ? '&formality=prefer_' + formality
        : '';
    const data =
      'target_lang=' +
      encodeURIComponent(targetLang) +
      '&preserve_formatting=1' +
      '&tag_handling=xml' +
      tagFormality +
      '&text=' +
      encodeURIComponent(text);
    return (
      this.checkCanSendRequest('makeXMLTranslateRequest') ||
      this.http.post<DeepLResult>(url, data, httpOptions).pipe(
        tap((_) => ''),
        timeout(4500),
        catchError(this.handleError<any>('makeXMLTranslateRequest')),
      )
    );
  }
}
