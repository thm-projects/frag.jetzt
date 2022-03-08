import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RoomService } from '../../../services/http/room.service';
import { Room } from '../../../models/room';
import { forkJoin, Subscription } from 'rxjs';
import { ModeratorService } from '../../../services/http/moderator.service';
import { map } from 'rxjs/operators';
import { AuthenticationService, LoginResult } from '../../../services/http/authentication.service';
import { UserRole } from '../../../models/user-roles.enum';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';

@Component({
  selector: 'app-moderator-join',
  templateUrl: './moderator-join.component.html',
  styleUrls: ['./moderator-join.component.scss']
})
export class ModeratorJoinComponent implements OnInit, OnDestroy {

  room: Room;
  isSending: boolean;
  private moderatorRoom: Room;
  private _sub: Subscription;

  get user() {
    return this.authenticationService.getUser();
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private roomService: RoomService,
    private moderatorService: ModeratorService,
    private authenticationService: AuthenticationService,
    private translateService: TranslateService,
    private languageService: LanguageService,
  ) {
    this.translateService.use(this.languageService.currentLanguage());
  }

  ngOnInit(): void {
    this._sub = this.languageService.getLanguage().subscribe(lang => this.translateService.use(lang));
    this.route.params.subscribe(params => {
      this.authenticationService.guestLogin(UserRole.PARTICIPANT).subscribe(result => {
        if (result !== LoginResult.Success) {
          this.router.navigate(['/']);
          return;
        }
        this.roomService.getErrorHandledRoomByShortId(params.shortId, () => {
          this.router.navigate(['/']);
        }).subscribe(room => {
          if (!room) {
            this.router.navigate(['/']);
            return;
          }
          this.moderatorRoom = room;
          this.onRoomReceive(room);
        });
      });
    });
  }

  ngOnDestroy() {
    this._sub?.unsubscribe();
  }

  confirm(): void {
    this.isSending = true;

    this.moderatorService.addByRoomCode(this.moderatorRoom.id).subscribe({
      next: () => {
        this.roomService.addToHistory(this.room.id);
        this.authenticationService.setAccess(this.room.shortId, UserRole.EXECUTIVE_MODERATOR);
        this.router.navigate([`/moderator/room/${this.room.shortId}/comments`]);
      },
      error: () => {
        this.isSending = false;
      }
    });
  }

  deny(): void {
    this.router.navigate(['/']);
  }

  private onRoomReceive(modRoom: Room) {
    if (!modRoom?.moderatorRoomReference) {
      this.router.navigate(['/']);
      return;
    }
    forkJoin([
      this.roomService.getRoom(modRoom.moderatorRoomReference),
      this.moderatorService.get(modRoom.moderatorRoomReference)
        .pipe(map(mods => new Set(mods.map(m => m.accountId))))
    ]).subscribe(([room, mods]) => {
      if (room.ownerId === this.user.id) {
        this.authenticationService.setAccess(room.shortId, UserRole.CREATOR);
        this.router.navigate([`/creator/room/${room.shortId}/comments`]);
        return;
      }
      if (mods.has(this.user.id)) {
        this.roomService.addToHistory(room.id);
        this.authenticationService.setAccess(room.shortId, UserRole.EXECUTIVE_MODERATOR);
        this.router.navigate([`/moderator/room/${room.shortId}/comments`]);
        return;
      }
      this.room = room;
    });
  }

}
