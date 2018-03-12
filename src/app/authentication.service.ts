import { Injectable } from '@angular/core';
import { User } from './user';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { UserRole } from './user-roles.enum';
import { DataStoreService } from './data-store.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ClientAuthentication } from './client-authentication';

// TODO: connect to API
@Injectable()
export class AuthenticationService {
  private readonly STORAGE_KEY: string = 'USER';
  private user: User;
  private apiBaseUrl = 'https://arsnova-staging.mni.thm.de/api';
  private apiV2Url = 'https://arsnova-staging.mni.thm.de/v2';
  private apiAuthUrl = '/auth';
  private apiLoginUrl = '/login';
  private apiUserUrl = '/user';
  private apiRegisterUrl = '/register';
  private apiRegisteredUrl = '/registered';
  private apiResetPasswordUrl = '/resetpassword';
  private httpOptions = {
    headers: new HttpHeaders({})
  };

  constructor(private dataStoreService: DataStoreService,
              private http: HttpClient) {
    if (dataStoreService.has(this.STORAGE_KEY)) {
      // Load user data from local data store if available
      this.user = JSON.parse(dataStoreService.get(this.STORAGE_KEY));
    }
  }

  login(email: string, password: string): Observable<ClientAuthentication> {
    const connectionUrl: string = this.apiBaseUrl + this.apiAuthUrl + this.apiLoginUrl + this.apiRegisteredUrl;

    return this.http.post<ClientAuthentication>(connectionUrl, {
      loginId: email,
      password: password
    }, this.httpOptions);
  }

  guestLogin(): Observable<ClientAuthentication> {
    const connectionUrl: string = this.apiBaseUrl + this.apiAuthUrl + this.apiLoginUrl + '/guest';

    return this.http.post<ClientAuthentication>(connectionUrl, null, this.httpOptions);
  }

  register(email: string, password: string): Observable<ClientAuthentication> {
    const connectionUrl: string = this.apiBaseUrl + this.apiRegisterUrl;

    return this.http.post<ClientAuthentication>(connectionUrl, {
      loginId: email,
      password: password
    }, this.httpOptions);
  }

  resetPassword(email: string): Observable<boolean> {
    const connectionUrl: string = this.apiV2Url + this.apiUserUrl + email + this.apiResetPasswordUrl;

    return this.http.post<boolean>(connectionUrl, {
      key: null,
      password: null
    }, this.httpOptions);
  }

  logout() {
    // Destroy the persisted user data
    this.dataStoreService.remove(this.STORAGE_KEY);
    this.user = undefined;
  }

  getUser(): User {
    return this.user;
  }

  setUser(user: User): void {
    this.user = user;
    this.dataStoreService.set(this.STORAGE_KEY, JSON.stringify(this.user));
  }

  isLoggedIn(): boolean {
    return this.user !== undefined;
  }

  getRole(): UserRole {
    return this.isLoggedIn() ? this.user.userRole : undefined;
  }

  getToken(): string {
    return this.user.token;
  }

}
