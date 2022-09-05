import {Component, OnInit} from '@angular/core';
import {RoomService} from '../../../../services/http/room.service';
import {UserService} from '../../../../services/http/user.service';
import {AuthenticationService} from '../../../../services/http/authentication.service';
import {User} from '../../../../models/user';
import {Room} from '../../../../models/room';
import {SessionService} from '../../../../services/util/session.service';
import {SurveyService} from '../../../../services/http/survey.service';
import {SurveyStorage} from '../../../../models/survey/survey-storage';
import {MatDialog} from '@angular/material/dialog';
import {SurveyCreateComponent} from '../../_dialogs/survey-create/survey-create.component';

@Component({
  selector: 'app-survey-page',
  templateUrl: './survey-page.component.html',
  styleUrls: ['./survey-page.component.scss']
})
export class SurveyPageComponent implements OnInit {

  public storage: SurveyStorage;
  private user: User;
  private room: Room;

  constructor(
    private roomService: RoomService,
    private userService: UserService,
    private authenticationService: AuthenticationService,
    private sessionService: SessionService,
    private surveyService: SurveyService,
    private dialog: MatDialog
  ) {
  }

  ngOnInit(): void {
    this.sessionService.getRoomOnce().subscribe(room => {
      this.room = room;
      this.surveyService.getStorage(this.room).subscribe(storage => {
        this.storage = storage;
      });
    });
    this.authenticationService.watchUser.subscribe(user => {
      this.user = user;
    });
  }

  openCreateSurveyDialog() {
    const createDialog = this.dialog.open(SurveyCreateComponent, SurveyCreateComponent.dialogConfig);
    createDialog.componentInstance.init(this);
    createDialog.componentInstance.onClose.subscribe(survey => {

    });

  }

}

