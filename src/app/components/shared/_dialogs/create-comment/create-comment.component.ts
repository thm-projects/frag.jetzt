import { Component, Inject, Input, OnInit, ViewChild } from '@angular/core';
import { NotificationService } from '../../../../services/util/notification.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { User } from '../../../../models/user';
import { EventService } from '../../../../services/util/event.service';
import { LanguagetoolService } from '../../../../services/http/languagetool.service';
import { WriteCommentComponent } from '../../write-comment/write-comment.component';
import { DeepLService } from '../../../../services/http/deep-l.service';
import { SpacyService } from '../../../../services/http/spacy.service';
import { UserRole } from '../../../../models/user-roles.enum';
import { RoomDataService } from '../../../../services/util/room-data.service';
import { BrainstormingSession } from '../../../../models/brainstorming-session';
import { LanguageService } from '../../../../services/util/language.service';

@Component({
  selector: 'app-submit-comment',
  templateUrl: './create-comment.component.html',
  styleUrls: ['./create-comment.component.scss']
})
export class CreateCommentComponent implements OnInit {

  @ViewChild(WriteCommentComponent) commentComponent: WriteCommentComponent;
  @Input() user: User;
  @Input() userRole: UserRole;
  @Input() roomId: string;
  @Input() tags: string[];
  @Input() brainstormingData: BrainstormingSession;

  constructor(
    private notification: NotificationService,
    public dialogRef: MatDialogRef<CreateCommentComponent>,
    private roomDataService: RoomDataService,
    private translateService: TranslateService,
    public dialog: MatDialog,
    public languagetoolService: LanguagetoolService,
    private deeplService: DeepLService,
    private spacyService: SpacyService,
    public eventService: EventService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private languageService: LanguageService,
  ) {
    this.languageService.getLanguage().subscribe(lang => this.translateService.use(lang));
  }

  ngOnInit() {
  }

  onNoClick(comment?: Comment): void {
    this.dialogRef.close(comment);
  }
}
