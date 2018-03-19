import { Injectable } from '@angular/core';
import { User } from './user';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { UserRole } from './user-roles.enum';
import { DataStoreService } from './data-store.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ClientAuthentication } from './client-authentication';

@Injectable()
export class AuthenticationService {
  private readonly STORAGE_KEY: string = 'USER';
  private user: User;
  private apiUrl = {
    baseUrl : 'https://arsnova-staging.mni.thm.de/api',
    v2Url : 'https://arsnova-staging.mni.thm.de/v2',
    authUrl : '/auth',
    loginUrl : '/login',
    userUrl : '/user',
    registerUrl : '/register',
    registeredUrl : '/registered',
    resetPasswordUrl : '/resetpassword'
  };
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

  login(email: string, password: string, userRole: UserRole): Observable<boolean> {
    const connectionUrl: string = this.apiUrl.baseUrl + this.apiUrl.authUrl + this.apiUrl.loginUrl + this.apiUrl.registeredUrl;

    return this.checkLogin(this.http.post<ClientAuthentication>(connectionUrl, {
      loginId: email,
      password: password
    }, this.httpOptions), userRole);
  }

  guestLogin(): Observable<boolean> {
    const connectionUrl: string = this.apiUrl.baseUrl + this.apiUrl.authUrl + this.apiUrl.loginUrl + '/guest';

    return this.checkLogin(this.http.post<ClientAuthentication>(connectionUrl, null, this.httpOptions), UserRole.PARTICIPANT);
  }

  // ToDo: Check return type of register route
  register(email: string, password: string): Observable<ClientAuthentication> {
    const connectionUrl: string = this.apiUrl.baseUrl + this.apiUrl.registerUrl;

    return this.http.post<ClientAuthentication>(connectionUrl, {
      loginId: email,
      password: password
    }, this.httpOptions);
  }

  resetPassword(email: string): Observable<boolean> {
    const connectionUrl: string = this.apiUrl.v2Url + this.apiUrl.userUrl + email + this.apiUrl.resetPasswordUrl;

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
    return this.isLoggedIn() ? this.user.role : undefined;
  }

  getToken(): string {
    return this.user.token;
  }

  checkLogin(clientAuthentication: Observable<ClientAuthentication>, userRole: UserRole): Observable<boolean> {
    return clientAuthentication.map(result => {
      if (result) {
        this.setUser(new User(
          result.userId,
          result.loginId,
          result.authProvider,
          result.token, userRole));
        return true;
      } else {
        return false;
      }
    }).catch(() => {
      return of(false);
    });
  }

}
