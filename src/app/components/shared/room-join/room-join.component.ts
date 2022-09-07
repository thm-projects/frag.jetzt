import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Room } from '../../../models/room';
import { RoomService } from '../../../services/http/room.service';
import { Router } from '@angular/router';
import { RegisterErrorStateMatcher } from '../../home/_dialogs/register/register.component';
import { FormControl, Validators } from '@angular/forms';
import { NotificationService } from '../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { UserRole } from '../../../models/user-roles.enum';
import { User } from '../../../models/user';
import { ModeratorService } from '../../../services/http/moderator.service';
import { KeyboardUtils } from '../../../utils/keyboard';
import { KeyboardKey } from '../../../utils/keyboard/keys';
import { forkJoin } from 'rxjs';
import { UserManagementService } from '../../../services/util/user-management.service';
import { SessionService } from '../../../services/util/session.service';

@Component({
  selector: 'app-room-join',
  templateUrl: './room-join.component.html',
  styleUrls: ['./room-join.component.scss']
})
export class RoomJoinComponent implements OnInit {
  @ViewChild('sessionCode') sessionCodeElement: ElementRef;

  user: User;

  sessionCodeFormControl = new FormControl('', [Validators.required, Validators.pattern('[0-9 ]*')]);

  matcher = new RegisterErrorStateMatcher();

  constructor(
    private roomService: RoomService,
    private router: Router,
    public notificationService: NotificationService,
    private translateService: TranslateService,
    public userManagementService: UserManagementService,
    private moderatorService: ModeratorService,
    public sessionService: SessionService,
  ) {
  }

  ngOnInit() {
    this.userManagementService.getUser().subscribe(newUser => this.user = newUser);
  }

  joinRoom(id: string): void {
    if (this.sessionCodeFormControl.hasError('required') || this.sessionCodeFormControl.hasError('minlength')) {
      return;
    }
    if (this.user) {
      this.getRoom(id);
      return;
    }
    this.userManagementService.forceLogin().subscribe(() => {
      this.getRoom(id);
    });
  }


  /**
   * Prettifies the room code input element which:
   *
   * - casts a 'xxxx xxxx' layout to the input field
   */
  prettifySessionCode(keyboardEvent: KeyboardEvent): void {
    const sessionCode: string = this.sessionCodeElement.nativeElement.value;
    const isBackspaceKeyboardEvent: boolean = KeyboardUtils.isKeyEvent(keyboardEvent, KeyboardKey.Backspace);

    // allow only backspace key press after all 8 digits were entered by the user
    if (
      sessionCode.length - (sessionCode.split(' ').length - 1) === 8 &&
      isBackspaceKeyboardEvent === false
    ) {
      keyboardEvent.preventDefault();
      keyboardEvent.stopPropagation();
    } else if (sessionCode.length === 4 && isBackspaceKeyboardEvent === false) { // add a space between each 4 digit group
      this.sessionCodeElement.nativeElement.value += ' ';
    }
  }

  private getRoom(id: string): void {
    this.roomService.getErrorHandledRoomByShortId(id, () => {
      this.translateService.get('home-page.no-room-found').subscribe(message => {
        this.notificationService.show(message);
      });
    }).subscribe(room => {
      if (room?.moderatorRoomReference) {
        this.onModeratorCodeJoin(room);
        return;
      }
      this.onRoomReceive(room);
    });
  }

  private onModeratorCodeJoin(room: Room) {
    if (!this.user) {
      this.getRoom(room.moderatorRoomReference);
      return;
    }
    forkJoin([
      this.roomService.getRoom(room.moderatorRoomReference),
      this.moderatorService.get(room.moderatorRoomReference)
    ]).subscribe(([parent, mods]) => {
      const modSet = new Set(mods.map(m => m.accountId));
      if (parent.ownerId === this.user.id || modSet.has(this.user.id)) {
        this.addAndNavigate(parent, modSet);
        return;
      }
      this.router.navigate([`/moderator/join/${room.shortId}`]);
    });
  }

  private onRoomReceive(room: Room) {
    if (!room) {
      this.translateService.get('home-page.no-room-found').subscribe(message => {
        this.notificationService.show(message);
      });
      return;
    }
    this.moderatorService.get(room.id).subscribe(mods => {
      const modSet = new Set(mods.map(m => m.accountId));
      if (this.user) {
        this.addAndNavigate(room, modSet);
        return;
      }
      this.guestLogin(room, modSet);
    });
  }

  private guestLogin(room: Room, mods: Set<string>) {
    this.userManagementService.forceLogin().subscribe(result => {
      if (result !== null) {
        this.addAndNavigate(room, mods);
      }
    });
  }

  private addAndNavigate(room: Room, mods: Set<string>) {
    if (this.user.id === room.ownerId) {
      this.userManagementService.setAccess(room.shortId, room.id, UserRole.CREATOR);
      this.router.navigate([`/creator/room/${room.shortId}/comments`]);
      return;
    }
    if (mods.has(this.user.id)) {
      this.userManagementService.setAccess(room.shortId, room.id, UserRole.EXECUTIVE_MODERATOR);
      this.router.navigate([`/moderator/room/${room.shortId}/comments`]);
      return;
    }
    this.userManagementService.setAccess(room.shortId, room.id, UserRole.PARTICIPANT);
    this.router.navigate([`/participant/room/${room.shortId}/comments`]);
  }
}
