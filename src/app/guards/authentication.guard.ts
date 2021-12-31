import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthenticationService } from '../services/http/authentication.service';

import { NotificationService } from '../services/util/notification.service';
import { UserRole } from '../models/user-roles.enum';
import { SessionService } from '../services/util/session.service';

@Injectable()
export class AuthenticationGuard implements CanActivate {

  constructor(
    private authenticationService: AuthenticationService,
    private notificationService: NotificationService,
    private router: Router,
    private sessionService: SessionService,
  ) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const requiredRoles = route.data['roles'] as Array<UserRole>;
    const url = decodeURI(state.url);
    let wasAllowed = null;
    wasAllowed = this.sessionService.validateNewRoute(route.params.shortId, requiredRoles[0], allowed => {
      if (allowed === wasAllowed) {
        return;
      }
      if (!allowed) {
        this.onNotAllowed();
        return;
      }
      if (wasAllowed !== null) {
        this.router.navigate([url]);
      }
    });
    return wasAllowed;
  }

  private onNotAllowed() {
    this.notificationService.show(`You're not authorized to view this page.`);
    // TODO: redirect to error page
    this.router.navigate(['/']);
  }
}
