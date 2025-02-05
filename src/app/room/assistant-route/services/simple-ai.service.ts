import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BaseHttpService } from 'app/services/http/base-http.service';
import { map, tap } from 'rxjs';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

export interface Keywords {
  keywords: string[];
  entities: string[];
  special: string[];
}

export interface ModerationResult {
  detoxify: { [key: string]: number };
  celadon: { [key: string]: number | string };
  openai?: { [key: string]: number | boolean };
  sentiment: [positive: number, neutral: number, negative: number];
}

@Injectable({
  providedIn: 'root',
})
export class SimpleAIService extends BaseHttpService {
  private apiUrl = {
    base: '/ai',
    improve: '/improve',
    keyword: '/keyword',
    invoke: '/invoke',
    category: '/category',
    extract: '/extract',
    apply: '/apply',
    similarity: '/similarity',
    embed: '/embed',
    moderate: '/moderate',
  };

  constructor(private http: HttpClient) {
    super();
  }

  improveWriting(text: string) {
    const url = `${this.apiUrl.base}${this.apiUrl.improve}${this.apiUrl.invoke}`;
    return this.http
      .post(
        url,
        {
          input: {
            text,
          },
        },
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        map((x) => x['output']),
      );
  }

  getKeywords(text: string) {
    const url = `${this.apiUrl.base}${this.apiUrl.keyword}${this.apiUrl.invoke}`;
    return this.http
      .post<Keywords>(
        url,
        {
          input: {
            text,
          },
          config: {
            configurable: {
              allow_duplicates: false,
            },
          },
        },
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        map((x) => x['output']),
      );
  }

  extractCategories(texts: string[]) {
    const url = `${this.apiUrl.base}${this.apiUrl.category}${this.apiUrl.extract}`;
    return this.http
      .post<{ categories: string[] }>(
        url,
        {
          texts,
        },
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        map((e) => e.categories),
      );
  }

  selectCategory(categories: string[], text: string) {
    const url = `${this.apiUrl.base}${this.apiUrl.category}${this.apiUrl.apply}`;
    return this.http
      .post<{ category: string }>(
        url,
        {
          categories,
          text,
        },
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        map((e) => e.category),
      );
  }

  getVectorEmbeddings(texts: string[]) {
    const url = `${this.apiUrl.base}${this.apiUrl.similarity}${this.apiUrl.embed}`;
    return this.http
      .post<string[]>(
        url,
        {
          texts,
        },
        httpOptions,
      )
      .pipe(tap(() => ''));
  }

  moderateContent(texts: string[], allowOpenai = false) {
    const url = `${this.apiUrl.base}${this.apiUrl.moderate}/?allow_openai=${allowOpenai}`;
    return this.http
      .post<ModerationResult[]>(
        url,
        {
          texts,
        },
        httpOptions,
      )
      .pipe(tap(() => ''));
  }
}
