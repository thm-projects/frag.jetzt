import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BaseHttpService } from 'app/services/http/base-http.service';
import { map, tap } from 'rxjs';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

const url = {
  base: '/ai/management',
  consent: '/consent',
};

@Injectable({
  providedIn: 'root',
})
export class ManageAiService extends BaseHttpService {
  constructor(private http: HttpClient) {
    super();
  }

  isConsented() {
    const end = `${url.base}${url.consent}`;
    return this.http.get<{ consented: boolean | null }>(end, httpOptions).pipe(
      tap(() => ''),
      map((o) => o.consented),
    );
  }

  updateConsent(consent: boolean) {
    const end = `${url.base}${url.consent}`;
    return this.http
      .post<{ consented: boolean }>(end, { data: { consent } }, httpOptions)
      .pipe(
        tap(() => ''),
        map((o) => o.consented),
      );
  }
}
