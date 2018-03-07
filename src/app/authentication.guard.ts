import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { AuthenticationService } from './authentication.service';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/catch';
import { NotificationService } from './notification.service';
import { UserRole } from './user-roles.enum';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(private authenticationService: AuthenticationService,
              private notificationService: NotificationService,
              private router: Router) {
  }

  canActivate(next: ActivatedRouteSnapshot,
              state: RouterStateSnapshot): Observable<boolean> {
    return this.authenticationService.getUser().map(user => {
      // Get roles having access to this route
      // undefined if every logged in user should have access regardless of its role
      const requiredRoles = next.data['roles'] as Array<UserRole>;
      // Allow access when user is logged in AND
      // the route doesn't require a specific role OR
      // the user's role is one of the required roles
      if (user && (!requiredRoles || requiredRoles.includes(user.role))) {
        return true;
      }
      this.notificationService.show(`You're not authorized to view this page.`);
      // TODO: redirect to error page
      this.router.navigate(['/']);
      return false;
    });
  }
}
