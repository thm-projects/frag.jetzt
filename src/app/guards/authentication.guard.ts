import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';

import { NotificationService } from '../services/util/notification.service';
import { UserRole } from '../models/user-roles.enum';
import { SessionService } from '../services/util/session.service';
import { UserManagementService } from '../services/util/user-management.service';

@Injectable()
export class AuthenticationGuard implements CanActivate {

  constructor(
    private userManagementService: UserManagementService,
    private notificationService: NotificationService,
    private router: Router,
    private sessionService: SessionService,
  ) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (route.data.superAdmin) {
      return this.isSuperAdmin();
    }
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
    if (!wasAllowed) {
      this.onNotAllowed();
    }
    return wasAllowed;
  }

  private isSuperAdmin() {
    if (!this.userManagementService.getCurrentUser()?.isSuperAdmin) {
      this.onNotAllowed();
      return false;
    }
    return true;
  }

  private onNotAllowed() {
    this.notificationService.show(`You're not authorized to view this page.`);
    this.router.navigate(['/']);
  }
}
