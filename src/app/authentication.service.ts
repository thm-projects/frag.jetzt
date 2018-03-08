import { Injectable } from '@angular/core';
import { User } from './user';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { UserRole } from './user-roles.enum';

// TODO: connect to API
// TODO: persist user data (shouldn't get lost on page refresh)
@Injectable()
export class AuthenticationService {
  private mockUser: User;

  constructor() { }

  login(email: string, password: string, role: UserRole): Observable<boolean> {
    this.mockUser = new User(1, '', email, role);
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
    return of(this.mockUser !== undefined);
  }

  getRole(): Observable<UserRole> {
    return of(this.mockUser.role);
  }

}
