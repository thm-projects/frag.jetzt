import { Component, Inject, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NotificationService } from '../../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { RoomCreatorPageComponent } from '../../../creator/room-creator-page/room-creator-page.component';
import { LanguageService } from '../../../../services/util/language.service';
import { EventService } from '../../../../services/util/event.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-topic-cloud-filter',
  templateUrl: './topic-cloud-filter.component.html',
  styleUrls: ['./topic-cloud-filter.component.scss']
})
export class TopicCloudFilterComponent implements OnInit{
<<<<<<< HEAD
=======
  @Input()filteredComments: any;
  @Input()commentsFilteredByTime: any;
  periodsList = Object.values(Period);
  period: Period = Period.ALL;
>>>>>>> add button on topic-cloud dialog

  constructor(public dialogRef: MatDialogRef<RoomCreatorPageComponent>,
    public dialog: MatDialog,
    public notificationService: NotificationService,
    public translationService: TranslateService,
    protected langService: LanguageService,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public eventService: EventService) {
      langService.langEmitter.subscribe(lang => translationService.use(lang));
  }

  ngOnInit() {
    this.translationService.use(localStorage.getItem('currentLang'));
  }

  closeDialog(): void {
  }

  /**
   * Returns a lambda which closes the dialog on call.
   */
   cancelButtonActionCallback(): () => void {
    return () => this.dialogRef.close('abort');
  }


  /**
   * Returns a lambda which executes the dialog dedicated action on call.
   */
  buildSaveActionCallback(): () => void {
    return () => this.closeDialog();
  }

  confirmButtonActionCallback(): () => void {
   // 
    return () => this.dialogRef.close(this.router.navigateByUrl('/participant/room/' +localStorage.getItem('roomId')+ '/comments/tagcloud'));
  }
  resetBuildCloseDialogActionCallback():() => void {
    this.commentsFilteredByTime = [];
    this.filteredComments = [];
    return () => this.dialogRef.close('reset');
  }
}
