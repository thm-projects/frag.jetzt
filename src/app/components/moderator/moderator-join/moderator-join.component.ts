import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RoomService } from '../../../services/http/room.service';
import { Room } from '../../../models/room';
import { forkJoin } from 'rxjs';
import { ModeratorService } from '../../../services/http/moderator.service';
import { map } from 'rxjs/operators';
import { UserRole } from '../../../models/user-roles.enum';
import { AccountStateService } from 'app/services/state/account-state.service';
import { forceLogin, user } from 'app/user/state/user';

@Component({
  selector: 'app-moderator-join',
  templateUrl: './moderator-join.component.html',
  styleUrls: ['./moderator-join.component.scss'],
  standalone: false,
})
export class ModeratorJoinComponent implements OnInit {
  room: Room;
  isSending: boolean;
  private moderatorRoom: Room;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private roomService: RoomService,
    private moderatorService: ModeratorService,
    private accountState: AccountStateService,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      forceLogin().subscribe((result) => {
        if (!result) {
          this.router.navigate(['/']);
          return;
        }
        this.roomService
          .getErrorHandledRoomByShortId(params['shortId'], () => {
            this.router.navigate(['/']);
          })
          .subscribe((room) => {
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

  confirm(): void {
    this.isSending = true;

    this.moderatorService.addByRoomCode(this.moderatorRoom.id).subscribe({
      next: () => {
        this.roomService.addToHistory(this.room.id);
        this.accountState
          .setAccess(
            this.room.shortId,
            this.room.id,
            UserRole.EXECUTIVE_MODERATOR,
          )
          .subscribe();
        this.router.navigate([`/moderator/room/${this.room.shortId}/comments`]);
      },
      error: () => {
        this.isSending = false;
      },
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
      this.moderatorService
        .get(modRoom.moderatorRoomReference)
        .pipe(map((mods) => new Set(mods.map((m) => m.accountId)))),
    ]).subscribe(([room, mods]) => {
      const id = user()?.id;
      if (room.ownerId === id) {
        this.accountState
          .setAccess(room.shortId, room.id, UserRole.CREATOR)
          .subscribe();
        this.router.navigate([`/creator/room/${room.shortId}/comments`]);
        return;
      }
      if (mods.has(id)) {
        this.roomService.addToHistory(room.id);
        this.accountState
          .setAccess(room.shortId, room.id, UserRole.EXECUTIVE_MODERATOR)
          .subscribe();
        this.router.navigate([`/moderator/room/${room.shortId}/comments`]);
        return;
      }
      this.room = room;
    });
  }
}
