import { Injectable } from '@angular/core';
import { BaseHttpService } from './base-http.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map, tap, timeout, mergeMap } from 'rxjs/operators';

/* eslint-disable @typescript-eslint/naming-convention */
const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' })
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
  ZH = 'ZH'
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
  ZH = 'ZH'
}

/* eslint-enable @typescript-eslint/naming-convention */

export enum FormalityType {
  default = '',
  less = 'less',
  more = 'more'
}

@Injectable({
  providedIn: 'root'
})
export class DeepLService extends BaseHttpService {

  constructor(private http: HttpClient) {
    super();
    this.checkAPIStatus().subscribe(hasQuota => {
      if (!hasQuota) {
        this.setTimeout(86_400_000);
      }
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

  improveTextStyle(text: string, temTargetLang: TargetLang, formality = FormalityType.default): Observable<string> {
    return this.makeXMLTranslateRequest(text, temTargetLang, formality).pipe(
      mergeMap(result =>
        this.makeXMLTranslateRequest(
          result.translations[0].text,
          DeepLService.transformSourceToTarget(result.translations[0].detected_source_language),
          formality
        )),
      map(result => result.translations[0].text)
    );
  }

  private checkAPIStatus(): Observable<boolean> {
    const url = '/deepl/usage';
    return this.http.post<any>(url, '', httpOptions)
      .pipe(
        tap(_ => ''),
        timeout(1500),
        map(obj => obj.character_count < obj.character_limit),
        catchError(this.handleError<any>('checkAPIStatus')),
      );
  }

  private makeXMLTranslateRequest(text: string, targetLang: TargetLang, formality: FormalityType): Observable<DeepLResult> {
    const url = '/deepl/translate';
    const tagFormality = DeepLService.supportsFormality(targetLang) && formality !== FormalityType.default ? '&formality=' + formality : '';
    const data = 'target_lang=' + encodeURIComponent(targetLang) +
      '&preserve_formatting=1' +
      '&tag_handling=xml' + tagFormality +
      '&text=' + encodeURIComponent(text);
    return this.http.post<DeepLResult>(url, data, httpOptions)
      .pipe(
        tap(_ => ''),
        timeout(4500),
        catchError(this.handleError<any>('makeXMLTranslateRequest')),
      );
  }
}
