import { Injectable } from '@angular/core';
import { User } from './user';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { UserRole } from './user-roles.enum';
import { DataStoreService } from './data-store.service';
import { HttpClient } from '@angular/common/http';

// TODO: connect to API
// TODO: persist user data (shouldn't get lost on page refresh)
@Injectable()
export class AuthenticationService {
  private readonly STORAGE_KEY: string = 'USER';
  private user: User;
  private apiBaseUrl = 'https://arsnova-staging.mni.thm.de/api';
  private apiAuthUrl = '/auth';
  private apiLoginUrl = '/login';

  constructor(private dataStoreService: DataStoreService,
              private http: HttpClient) {
    if (dataStoreService.has(this.STORAGE_KEY)) {
      // Load user data from local data store if available
      this.user = JSON.parse(dataStoreService.get(this.STORAGE_KEY));
    }
  }

  login(email: string, password: string, role: UserRole): Observable<boolean> {
    this.user = new User(1, '', email, role, 'TOKEN');
    // Store user data in local storage to retain the data when the user reloads the page
    this.dataStoreService.set(this.STORAGE_KEY, JSON.stringify(this.user));

    return of(true);
  }

  guestLogin() {
    const token = this.http.get(this.apiBaseUrl + this.apiAuthUrl + this.apiLoginUrl + '/guest');
    if (token != null) {
      return of(true);
    }
    return of(false);
  }

  register(email: string, password: string): Observable<boolean> {
    return of(true);
  }

  resetPassword(email: string): Observable<boolean> {
    return of(true);
  }

  logout() {
    // Destroy the persisted user data
    this.dataStoreService.remove(this.STORAGE_KEY);
    this.user = undefined;
  }

  getUser(): User {
    return this.user;
  }

  isLoggedIn(): boolean {
    return this.user !== undefined;
  }

  getRole(): UserRole {
    return this.isLoggedIn() ? this.user.role : undefined;
  }

}
