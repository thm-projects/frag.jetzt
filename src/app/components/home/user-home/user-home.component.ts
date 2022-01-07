import { Component, OnInit, OnDestroy, Renderer2, AfterContentInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { RoomCreateComponent } from '../../shared/_dialogs/room-create/room-create.component';
import { UserRole } from '../../../models/user-roles.enum';
import { User } from '../../../models/user';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { EventService } from '../../../services/util/event.service';
import { KeyboardUtils } from '../../../utils/keyboard';
import { KeyboardKey } from '../../../utils/keyboard/keys';

@Component({
  selector: 'app-user-home',
  templateUrl: './user-home.component.html',
  styleUrls: [ './user-home.component.scss' ]
})
export class UserHomeComponent implements OnInit, OnDestroy, AfterContentInit {
  user: User;
  creatorRole: UserRole = UserRole.CREATOR;
  participantRole: UserRole = UserRole.PARTICIPANT;

  listenerFn: () => void;

  constructor(
    public dialog: MatDialog,
    private translateService: TranslateService,
    protected langService: LanguageService,
    private authenticationService: AuthenticationService,
    private eventService: EventService,
    private liveAnnouncer: LiveAnnouncer,
    private _r: Renderer2
  ) {
    langService.getLanguage().subscribe(lang => translateService.use(lang));
  }

  ngAfterContentInit(): void {
    setTimeout( () => {
      document.getElementById('live_announcer-button').focus();
    }, 700);
  }
  ngOnInit() {
    this.authenticationService.watchUser.subscribe(newUser => this.user = newUser);
    this.listenerFn = this._r.listen(document, 'keyup', (event) => {
      if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit1) === true && this.eventService.focusOnInput === false) {
        document.getElementById('session_id-input').focus();
      } else if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit3) === true && this.eventService.focusOnInput === false) {
        document.getElementById('create_session-button').focus();
      } else if (
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Escape, KeyboardKey.Digit9) === true && this.eventService.focusOnInput === false
      ) {
        this.announce();
      } else if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Escape) === true && this.eventService.focusOnInput === true) {
        document.getElementById('session_enter-button').focus();
      }
    });
  }

  ngOnDestroy() {
    this.listenerFn();
  }

  public announce() {
    const lang: string = this.translateService.currentLang;
    this.liveAnnouncer.clear();
    if (lang === 'de') {
      this.liveAnnouncer.announce('Du befindest dich auf deiner Benutzer-Seite. ' +
        'Drücke die Taste 1 um einen Raum-Code einzugeben, die Taste 2 um auf das Sitzungs-Menü zu gelangen, ' +
        'die Taste 3 um eine neue Sitzung zu erstellen, die Taste 0 um zurück zur Startseite zu gelangen, ' +
        'oder die Taste 9 um diese Ansage zu wiederholen.', 'assertive');
    } else {
      this.liveAnnouncer.announce('You are on your user page.' +
        'Press 1 to enter a room code, key 2 to enter the session menu, ' +
        'key 3 to create a new session, key 0 to go back to the start page, ' +
        'or press the 9 key to repeat this announcement.', 'assertive');
    }
  }

  openCreateRoomDialog(): void {
    this.dialog.open(RoomCreateComponent, {
      width: '350px'
    });
  }
}
