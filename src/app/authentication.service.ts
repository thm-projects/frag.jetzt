import { Injectable } from '@angular/core';
import { User } from './user';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';

// TODO: connect to API
@Injectable()
export class AuthenticationService {
  private mockUser: User = new User(1, 'test', 'test@test.de', true);

  constructor() { }

  login(email: string, password: string): Observable<boolean> {
    return of(true);
  }

  register(email: string, password: string): Observable<boolean> {
    return of(true);
  }

  resetPassword(email: string): Observable<boolean> {
    return of(true);
  }

  logout() {
    this.mockUser = null;
  }

  getUser(): Observable<User> {
    return of(this.mockUser);
  }

  isLoggedIn(): Observable<boolean> {
    return of(this.mockUser !== null);
  }

  isCreator(): Observable<boolean> {
    return of(this.mockUser.isCreator);
  }

}
