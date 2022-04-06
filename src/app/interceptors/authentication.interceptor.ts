import { tap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';

import { AuthenticationService } from '../services/http/authentication.service';
import { NotificationService } from '../services/util/notification.service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

const AUTH_HEADER_KEY = 'Authorization';
const AUTH_SCHEME = 'Bearer';

@Injectable()
export class AuthenticationInterceptor implements HttpInterceptor {

  static readonly AUTH_ROUTES = [
    {
      allow: /^\/api(\/|$)/g,
      blacklist: [
        /^\/api\/ws\/websocket(\/|$)/g,
        /^\/api\/roomsubscription(\/|$)/g,
      ]
    }
  ];

  constructor(
    private authenticationService: AuthenticationService,
    private notificationService: NotificationService,
    private router: Router
  ) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.authenticationService.isLoggedIn()) {
      return next.handle(req);
    }
    const decodedUrl = req.url;
    const needsAuthentication = AuthenticationInterceptor.AUTH_ROUTES.some(route =>
      decodedUrl.match(route.allow) && !route.blacklist.some(entry => decodedUrl.match(entry)));
    if (!needsAuthentication) {
      return next.handle(req);
    }

    const token = this.authenticationService.getToken();
    const cloned = req.clone({
      headers: req.headers.set(AUTH_HEADER_KEY, `${AUTH_SCHEME} ${token}`)
    });

    return next.handle(cloned).pipe(tap({
      next: (event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          // Possible to do something with the response here
        }
      },
      error: (err: any) => {
        if (err instanceof HttpErrorResponse && err.status === 401) {
          this.authenticationService.logout();
          this.notificationService.show('You are not logged in.');
          this.router.navigate(['home']);
        }
      }
    }));
  }
}
