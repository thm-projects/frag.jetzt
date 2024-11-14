import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BaseHttpService } from 'app/services/http/base-http.service';
import { map, tap } from 'rxjs';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

interface Keywords {
  keywords: string[];
  entities: string[];
  special: string[];
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
  };

  constructor(private http: HttpClient) {
    super();
  }

  improveWriting(text: string, roomId: string) {
    const url = `${this.apiUrl.base}${this.apiUrl.improve}${this.apiUrl.invoke}`;
    return this.http
      .post(
        url,
        {
          input: {
            text,
          },
          config: {
            configurable: {
              room_id: roomId,
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

  getKeywords(text: string, roomId: string) {
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
              room_id: roomId,
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
}
