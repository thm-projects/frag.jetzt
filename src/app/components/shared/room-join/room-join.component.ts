import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Room } from '../../../models/room';
import { RoomService } from '../../../services/http/room.service';
import { Router } from '@angular/router';
import { RegisterErrorStateMatcher } from '../../home/_dialogs/register/register.component';
import { FormControl, Validators } from '@angular/forms';
import { NotificationService } from '../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { UserRole } from '../../../models/user-roles.enum';
import { User } from '../../../models/user';
import { Moderator } from '../../../models/moderator';
import { ModeratorService } from '../../../services/http/moderator.service';
import { EventService } from '../../../services/util/event.service';
import { KeyboardUtils } from '../../../utils/keyboard';
import { KeyboardKey } from '../../../utils/keyboard/keys';

@Component({
  selector: 'app-room-join',
  templateUrl: './room-join.component.html',
  styleUrls: ['./room-join.component.scss']
})
export class RoomJoinComponent implements OnInit {
  @ViewChild('roomId') roomIdElement: ElementRef;

  room: Room;
  user: User;

  roomFormControl = new FormControl('', [Validators.required, Validators.pattern('[0-9 ]*')]);

  matcher = new RegisterErrorStateMatcher();

  constructor(
    private roomService: RoomService,
    private router: Router,
    public notificationService: NotificationService,
    private translateService: TranslateService,
    public authenticationService: AuthenticationService,
    private moderatorService: ModeratorService,
    public eventService: EventService
  ) {
  }

  ngOnInit() {
    this.roomIdElement.nativeElement.focus();
    this.authenticationService.watchUser.subscribe(newUser => this.user = newUser);
  }

  onEnter() {
    this.getRoom(this.roomIdElement.nativeElement.value);
  }

  getRoom(id: string): void {
    if (id.length - (id.split(' ').length - 1) < 8) {
      this.translateService.get('home-page.exactly-8').subscribe(message => {
        this.notificationService.show(message);
      });
    } else if (this.roomFormControl.hasError('pattern')) {
      this.translateService.get('home-page.only-numbers').subscribe(message => {
        this.notificationService.show(message);
      });
    } else {
      this.roomService.getRoomByShortId(id.replace(/\s/g, ''))
      .subscribe(room => {
        this.room = room;
        if (!room) {
          this.translateService.get('home-page.no-room-found').subscribe(message => {
            this.notificationService.show(message);
          });
        } else {
          if (!this.user) {
            this.guestLogin();
          } else {
            if (this.user.role === UserRole.CREATOR) {
              this.authenticationService.logout();
              this.guestLogin();
            } else {
              this.addAndNavigate();
            }
          }
        }
      });
    }
  }

  joinRoom(id: string): void {
    if (!this.roomFormControl.hasError('required') && !this.roomFormControl.hasError('minlength')) {
      this.getRoom(id);
    }
  }

  guestLogin() {
    this.authenticationService.guestLogin(UserRole.PARTICIPANT).subscribe(loggedIn => {
      if (loggedIn === 'true') {
        this.addAndNavigate();
      }
    });
  }

  addAndNavigate() {
    if (this.user.id === this.room.ownerId) {
      this.router.navigate([`/creator/room/${this.room.shortId}/comments`]);
    } else {
      this.roomService.addToHistory(this.room.id);
      this.moderatorService.get(this.room.id).subscribe((moderators: Moderator[]) => {
        let isModerator = false;
        for (const m of moderators) {
          if (m.userId === this.user.id) {
            this.authenticationService.setAccess(this.room.shortId, UserRole.EXECUTIVE_MODERATOR);
            this.router.navigate([`/moderator/room/${this.room.shortId}/comments`]);
            isModerator = true;
          }
        }
        if (!isModerator) {
          this.authenticationService.setAccess(this.room.shortId, UserRole.PARTICIPANT);
          this.router.navigate([`/participant/room/${this.room.shortId}/comments`]);
        }
      });
    }
  }

  cookiesDisabled(): boolean {
    return localStorage.getItem('cookieAccepted') === 'false';
  }


  /**
   * Prettifies the session code input element which:
   *
   * - casts a 'xxxx xxxx' layout to the input field
   */
  prettifySessionCode(keyboardEvent: KeyboardEvent): void {
    const sessionCode: string = this.roomIdElement.nativeElement.value;
    const isBackspaceKeyboardEvent: boolean = KeyboardUtils.isKeyEvent(keyboardEvent, KeyboardKey.Backspace);

    // allow only backspace key press after all 8 digits were entered by the user
    if (
      sessionCode.length - (sessionCode.split(' ').length - 1) === 8 &&
      isBackspaceKeyboardEvent === false
    ) {
      keyboardEvent.preventDefault();
      keyboardEvent.stopPropagation();
    } else if (sessionCode.length === 4 && isBackspaceKeyboardEvent === false) { // add a space between each 4 digit group
      this.roomIdElement.nativeElement.value += ' ';
    }
  }
}
