import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthenticationService } from '../services/http/authentication.service';



import { NotificationService } from '../services/util/notification.service';
import { UserRole } from '../models/user-roles.enum';
import { User } from '../models/user';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(private authenticationService: AuthenticationService,
              private notificationService: NotificationService,
              private router: Router) {
  }

  canActivate(route: ActivatedRouteSnapshot,
              state: RouterStateSnapshot): boolean {
    // Get roles having access to this route
    // undefined if every logged in user should have access regardless of its role
    const requiredRoles = route.data['roles'] as Array<UserRole>;
    // Allow access when user is logged in AND
    // the route doesn't require a specific role OR
    // the user's role is one of the required roles
    if (this.authenticationService.hasAccess(route.params.shortId, requiredRoles[0])) {
      return true;
    }

    this.notificationService.show(`You're not authorized to view this page.`);
    // TODO: redirect to error page
    this.router.navigate(['/']);
    return false;
  }
}
