import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlSegment,
} from '@angular/router';

import { UserRole } from '../models/user-roles.enum';
import { EventService } from 'app/services/util/event.service';
import {
  Observable,
  filter,
  first,
  forkJoin,
  map,
  of,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { AccountStateService } from 'app/services/state/account-state.service';
import { RoomStateService } from 'app/services/state/room-state.service';
import { RoomService } from 'app/services/http/room.service';
import { KeycloakRoles } from 'app/models/user';
import { RoomAccess } from 'app/base/db/models/db-room-access.model';
import { enterRoom } from 'app/room/state/room';
import { forceLogin, user$ } from 'app/user/state/user';

@Injectable()
export class AuthenticationGuard {
  constructor(
    private router: Router,
    private eventService: EventService,
    private accountState: AccountStateService,
    private roomState: RoomStateService,
    private roomService: RoomService,
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean> {
    const roomShortId = route.params['shortId'];
    enterRoom(roomShortId);
    const url = decodeURI(state.url);
    if (route.data['superAdmin']) {
      return user$.pipe(
        filter((v) => Boolean(v)),
        take(1),
        map((user) => user.hasRole(KeycloakRoles.AdminDashboard)),
        tap((v) => !v && this.onNotAllowed()),
      );
    }
    const possibleRoles = (route.data['roles'] ?? []) as UserRole[];
    const wantedRole = this.parseRole(url);
    return forkJoin([
      forceLogin().pipe(
        map((u) => u && u.hasRole(KeycloakRoles.AdminAllRoomsOwner)),
      ),
      this.accountState.access$.pipe(first(Boolean)),
    ]).pipe(
      switchMap(([isAdmin]) => {
        const accessRole = isAdmin
          ? UserRole.CREATOR
          : this.parseRoomAccess(this.accountState.getAccess(roomShortId));
        // User has less rights or wantedRole not in possible
        if (
          wantedRole > (accessRole || UserRole.PARTICIPANT) ||
          !possibleRoles.includes(wantedRole)
        ) {
          if (!accessRole) {
            if (possibleRoles.includes(UserRole.PARTICIPANT)) {
              return this.updateAccess(roomShortId).pipe(
                map(() => {
                  this.redirect(UserRole.PARTICIPANT, route.url);
                  return false;
                }),
              );
            }
            this.onNotAllowed();
            return of(false);
          }
          const role = this.findRole(possibleRoles, accessRole);
          if (role !== null) {
            this.redirect(role, route.url);
            return of(false);
          }
          this.onNotAllowed();
          return of(false);
        }
        // wantedRole = ok && wantendRole in possible
        if (accessRole !== UserRole.PARTICIPANT && !accessRole) {
          return this.updateAccess(roomShortId).pipe(map(() => true));
        }
        return of(true);
      }),
    );
  }

  private findRole(roles: UserRole[], ownRole: UserRole) {
    let highestRole = null;
    for (const role of roles) {
      if (role > ownRole) {
        continue;
      }
      if (highestRole == null || highestRole < role) {
        highestRole = role;
      }
    }
    return highestRole;
  }

  private updateAccess(roomShortId: string) {
    return this.roomState.room$
      .pipe(
        filter((v) => Boolean(v)),
        take(1),
      )
      .pipe(
        switchMap((room) => {
          if (room.shortId !== roomShortId) {
            return of();
          }
          this.roomService.addToHistory(room.id);
          return this.accountState.setAccess(
            roomShortId,
            room.id,
            UserRole.PARTICIPANT,
          );
        }),
      );
  }

  private parseRoomAccess(roomAccess: RoomAccess): UserRole {
    if (!roomAccess) {
      return null;
    }
    if (roomAccess.role === 'Creator') return UserRole.CREATOR;
    if (roomAccess.role === 'Moderator') return UserRole.EXECUTIVE_MODERATOR;
    return UserRole.PARTICIPANT;
  }

  private redirect(role: UserRole, segments: UrlSegment[]) {
    let url = '/participant/';
    if (role === UserRole.CREATOR) {
      url = '/creator/';
    } else if (role === UserRole.EXECUTIVE_MODERATOR) {
      url = '/moderator/';
    }
    url += segments.map((segment) => segment.path).join('/');
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

  private onNotAllowed() {
    this.router.navigate(['/']).then(() => {
      setTimeout(() => this.eventService.broadcast('not-authorized'));
    });
  }
}
