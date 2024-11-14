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
import { Observable } from 'rxjs';
import { user } from 'app/user/state/user';

const AUTH_HEADER_KEY = 'Authorization';
const AUTH_SCHEME = 'Bearer';

@Injectable()
export class AuthenticationInterceptor implements HttpInterceptor {
  static readonly AUTH_ROUTES = [
    {
      allow: /^\/api(\/|$)/g,
      blacklist: [
        /^\/api\/auth\/login\/guest(\/|$)/g,
        /^\/api\/auth\/login\/registered\/.*(\/|$)/g,
        /^\/api\/auth\/login(\/|$)/g,
        /^\/api\/keycloak-provider\/providers\/all(\/|$)/g,
        /^\/api\/motds\/all(\/|$)/g,
      ],
    },
    {
      allow: /^\/ai(\/|$)/g,
      blacklist: [],
    },
  ];

  constructor() {}

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    const account = user();
    if (!account) {
      return next.handle(req);
    }

    const token = account.token;
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
        next: (event: HttpEvent<unknown>) => {
          if (event instanceof HttpResponse) {
            // Possible to do something with the response here
          }
        },
        error: (err: unknown) => {
          if (err instanceof HttpErrorResponse) {
            // Possible to do something with the response here
          }
        },
      }),
    );
  }
}
