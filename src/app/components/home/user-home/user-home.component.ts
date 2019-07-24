import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { RoomCreateComponent } from '../../shared/_dialogs/room-create/room-create.component';
import { UserRole } from '../../../models/user-roles.enum';
import { User } from '../../../models/user';
import { AuthenticationService } from '../../../services/http/authentication.service';

@Component({
  selector: 'app-user-home',
  templateUrl: './user-home.component.html',
  styleUrls: [ './user-home.component.scss' ]
})
export class UserHomeComponent implements OnInit {
  user: User;
  creatorRole: UserRole = UserRole.CREATOR;
  participantRole: UserRole = UserRole.PARTICIPANT;

  constructor(
    public dialog: MatDialog,
    private translateService: TranslateService,
    protected langService: LanguageService,
    private authenticationService: AuthenticationService
  ) {
    langService.langEmitter.subscribe(lang => translateService.use(lang));
  }

  ngOnInit() {
    this.translateService.use(localStorage.getItem('currentLang'));
    this.authenticationService.watchUser.subscribe(newUser => this.user = newUser);
  }

  openCreateRoomDialog(): void {
    this.dialog.open(RoomCreateComponent, {
      width: '350px'
    });
  }
}
