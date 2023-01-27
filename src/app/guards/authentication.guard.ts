import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlSegment } from '@angular/router';

import { UserRole } from '../models/user-roles.enum';
import { SessionService } from '../services/util/session.service';
import { UserManagementService } from '../services/util/user-management.service';
import { EventService } from 'app/services/util/event.service';

@Injectable()
export class AuthenticationGuard implements CanActivate {

  constructor(
    private userManagementService: UserManagementService,
    private router: Router,
    private sessionService: SessionService,
    private eventService: EventService,
  ) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (route.data.superAdmin) {
      return this.isSuperAdmin();
    }
    const url = decodeURI(state.url);
    const requiredRoles = (route.data['roles'] ?? []) as UserRole[];
    let wasAllowed = null;
    wasAllowed = this.sessionService.validateNewRoute(
      route.params.shortId,
      this.parseRole(url),
      requiredRoles,
      (allowed, redirect) => {
        if (redirect !== undefined) {
          this.redirect(redirect, route.url);
          return;
        }
        if (wasAllowed === null) {
          return;
        }
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

  private redirect(role: UserRole, segments: UrlSegment[]) {
    let url = '/participant/';
    if (role === UserRole.CREATOR) {
      url = '/creator/';
    } else if (role === UserRole.EXECUTIVE_MODERATOR) {
      url = '/moderator/';
    }
    url += segments.map(segment => segment.path).join('/');
    this.router.navigate([url]);
  }

  private parseRole(url: string): UserRole {
    if (url.startsWith('/creator')) {
      return UserRole.CREATOR;
    } else if (url.startsWith('/moderator')) {
      return UserRole.EXECUTIVE_MODERATOR;
    } else if (url.startsWith('/participant')) {
      return UserRole.PARTICIPANT;
    }
    return null;
  }

  private isSuperAdmin() {
    if (!this.userManagementService.getCurrentUser()?.isSuperAdmin) {
      this.onNotAllowed();
      return false;
    }
    return true;
  }

  private onNotAllowed() {
    this.router.navigate(['/']).then(() => {
      setTimeout(() => this.eventService.broadcast('not-authorized'));
    });
  }
}
