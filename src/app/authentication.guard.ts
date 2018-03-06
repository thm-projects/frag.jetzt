import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { AuthenticationService } from './authentication.service';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/catch';
import { NotificationService } from './notification.service';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(private authenticationService: AuthenticationService,
              private notificationService: NotificationService,
              private router: Router) {
  }

  canActivate(next: ActivatedRouteSnapshot,
              state: RouterStateSnapshot): Observable<boolean> {
    return this.authenticationService.isLoggedIn().map(isLoggedIn => {
      if (!isLoggedIn) {
        this.notificationService.show(`You're not authorized to view this page.`);
        // TODO: redirect to error page
        this.router.navigate(['/']);
      }
      return isLoggedIn;
    });
  }
}
