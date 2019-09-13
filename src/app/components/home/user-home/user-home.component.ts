import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { MatDialog } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { RoomCreateComponent } from '../../shared/_dialogs/room-create/room-create.component';
import { UserRole } from '../../../models/user-roles.enum';
import { User } from '../../../models/user';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { EventService } from '../../../services/util/event.service';

@Component({
  selector: 'app-user-home',
  templateUrl: './user-home.component.html',
  styleUrls: [ './user-home.component.scss' ]
})
export class UserHomeComponent implements OnInit, OnDestroy {
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
    langService.langEmitter.subscribe(lang => translateService.use(lang));
  }

  ngOnInit() {
    this.translateService.use(localStorage.getItem('currentLang'));
    this.authenticationService.watchUser.subscribe(newUser => this.user = newUser);
    this.announce();
    this.listenerFn = this._r.listen(document, 'keyup', (event) => {
      if (event.keyCode === 49 && this.eventService.focusOnInput === false) {
        document.getElementById('session_id-input').focus();
      } else if (event.keyCode === 51 && this.eventService.focusOnInput === false) {
        document.getElementById('create_session-button').focus();
      } else if ((event.keyCode === 57 || event.keyCode === 27) && this.eventService.focusOnInput === false) {
        this.announce();
      } else if (event.keyCode === 27 && this.eventService.focusOnInput === true) {
        document.getElementById('session_enter-button').focus();
      }
    });
  }

  ngOnDestroy() {
    this.listenerFn();
  }

  public announce() {
    this.liveAnnouncer.announce('Du befindest dich auf deiner Benutzer-Seite. ' +
      'Drücke die Taste 1 um einen Sitzungs-Code einzugeben, die Taste 2 um auf das Sitzungs-Menü zu gelangen, ' +
      'die Taste 3 um eine neue Sitzung zu erstellen, die Taste 0 um zurück zur Startseite zu gelangen, ' +
      'oder die Taste 9 um diese Ansage zu wiederholen.', 'assertive');
  }

  openCreateRoomDialog(): void {
    this.dialog.open(RoomCreateComponent, {
      width: '350px'
    });
  }
}
