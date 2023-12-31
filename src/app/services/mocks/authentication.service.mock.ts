import { Injectable } from '@angular/core';
import { AuthenticationService } from '../http/authentication.service';
import { Observable, of } from 'rxjs';
import { generateBoolean } from '../../utils/test-utils';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationServiceMock extends AuthenticationService {
  constructor() {
    super(null);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  checkSuperAdmin(token: string): Observable<boolean> {
    return of(generateBoolean());
  }
}
