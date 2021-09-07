import { Injectable } from '@angular/core';
import { BaseHttpService } from './base-http.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map, tap, timeout } from 'rxjs/operators';
import { flatMap } from 'rxjs/internal/operators';

const httpOptions = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' })
};

interface DeepLResult {
  translations: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    detected_source_language: SourceLang;
    text: string;
  }[];
}

type SourceLang = 'BG' | 'CS' | 'DA' | 'DE' | 'EL' | 'EN' | 'ES' | 'ET' | 'FI' | 'FR' | 'HU' | 'IT' | 'JA' | 'LT'
  | 'LV' | 'NL' | 'PL' | 'PT' | 'RO' | 'RU' | 'SK' | 'SL' | 'SV' | 'ZH';

type TargetLang = 'BG' | 'CS' | 'DA' | 'DE' | 'EL' | 'EN-GB' | 'EN-US' | 'ES' | 'ET' | 'FI' | 'FR' | 'HU' | 'IT' |
  'JA' | 'LT' | 'LV' | 'NL' | 'PL' | 'PT-PT' | 'PT-BR' | 'RO' | 'RU' | 'SK' | 'SL' | 'SV' | 'ZH';

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

  private static transformSourceToTarget(lang: SourceLang): TargetLang {
    switch (lang) {
      case 'EN':
        return 'EN-US';
      case 'PT':
        return 'PT-PT';
      default:
        return lang;
    }
  }

  private static supportsFormality(lang: TargetLang): boolean {
    switch (lang) {
      case 'DE':
      case 'ES':
      case 'FR':
      case 'IT':
      case 'NL':
      case 'PL':
      case 'PT-BR':
      case 'PT-PT':
      case 'RU':
        return true;
      default:
        return false;
    }
  }

  improveTextStyle(text: string): Observable<string> {
    return this.makeXMLTranslateRequest(text, 'EN-US').pipe(
      flatMap(result =>
        this.makeXMLTranslateRequest(
          result.translations[0].text,
          DeepLService.transformSourceToTarget(result.translations[0].detected_source_language)
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

  private makeXMLTranslateRequest(text: string, targetLang: TargetLang): Observable<DeepLResult> {
    const url = '/deepl/translate';
    const formality = DeepLService.supportsFormality(targetLang) ? '&formality=more' : '';
    const data = 'target_lang=' + encodeURIComponent(targetLang) +
      '&tag_handling=xml' + formality +
      '&text=' + encodeURIComponent(text);
    return this.http.post<DeepLResult>(url, data, httpOptions)
      .pipe(
        tap(_ => ''),
        timeout(4500),
        catchError(this.handleError<any>('makeXMLTranslateRequest')),
      );
  }
}
