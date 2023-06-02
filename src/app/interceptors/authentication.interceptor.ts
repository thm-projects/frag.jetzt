import { tap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { NotificationService } from '../services/util/notification.service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { UserManagementService } from '../services/util/user-management.service';

const AUTH_HEADER_KEY = 'Authorization';
const AUTH_SCHEME = 'Bearer';

@Injectable()
export class AuthenticationInterceptor implements HttpInterceptor {
  static readonly AUTH_ROUTES = [
    {
      allow: /^\/api(\/|$)/g,
      blacklist: [
        /^\/api\/login\/guest(\/|$)/g,
        /^\/api\/login\/registered(\/|$)/g,
        /^\/api\/login(\/|$)/g,
        /^\/api\/user\/register(\/|$)/g,
        /^\/api\/user\/[^/]+\/activate(\/|$)/g,
        /^\/api\/user\/[^/]+\/resetactivation(\/|$)/g,
        /^\/api\/user\/[^\/]+\/resetpassword(\/|$)/g,
        /^\/api\/rating\/accumulated(\/|$)/g,
      ],
    },
  ];

  constructor(
    private userManagementService: UserManagementService,
    private notificationService: NotificationService,
    private router: Router,
    private translateService: TranslateService,
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    if (!this.userManagementService.isLoggedIn()) {
      return next.handle(req);
    }

    const token = this.userManagementService.getCurrentToken();
    if (!token) {
      return next.handle(req);
    }

    const decodedUrl = req.url;
    const needsAuthentication = AuthenticationInterceptor.AUTH_ROUTES.some(
      (route) =>
        decodedUrl.match(route.allow) &&
        !route.blacklist.some((entry) => decodedUrl.match(entry)),
    );
    if (!needsAuthentication) {
      return next.handle(req);
    }
    const cloned = req.clone({
      headers: req.headers.set(AUTH_HEADER_KEY, `${AUTH_SCHEME} ${token}`),
    });

    return next.handle(cloned).pipe(
      tap({
        next: (event: HttpEvent<any>) => {
          if (event instanceof HttpResponse) {
            // Possible to do something with the response here
          }
        },
        error: (err: any) => {
          if (err instanceof HttpErrorResponse) {
            // Possible to do something with the response here
          }
        },
      }),
    );
  }
}
