import { Injectable } from '@angular/core';
import { User } from '../../models/user';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ClientAuthentication } from '../../models/client-authentication';
import { BaseHttpService } from './base-http.service';

const httpOptions = {
  headers: new HttpHeaders({})
};

@Injectable()
export class UserService extends BaseHttpService {
  private apiUrl = {
    base: '/api',
    user: '/user',
    activate: '/activate'
  };

  constructor(private http: HttpClient) {
    super();
  }

  activate(name: string, activationKey: string): Observable<string> {
    const connectionUrl: string = this.apiUrl.base + this.apiUrl.user + '/~' + encodeURIComponent(name) + this.apiUrl.activate;

    return this.http.post<string>(connectionUrl, {
        key: activationKey
      }, httpOptions);
  }
}
