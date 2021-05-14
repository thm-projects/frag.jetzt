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
  @Input()filteredComments: any;
  @Input()commentsFilteredByTime: any;

  continueFilter: string = 'continueWithCurr';
  tmpCurFilters: string;
  tmpPeriod : string;

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
    this.tmpPeriod = localStorage.getItem('currentPeriod');
    this.tmpCurFilters = localStorage.getItem('currentFilters');
  }

  closeDialog(): void {
  }

  
  cancelButtonActionCallback(): () => void {
    return () => this.dialogRef.close('abort');
  }

  confirmButtonActionCallback(): () => void {
    localStorage.setItem('currentFilters', this.tmpCurFilters);
    localStorage.setItem('currentPeriod', this.tmpPeriod);
    localStorage.setItem('currentFromNowTimestamp', JSON.stringify(null)); 
    switch (this.continueFilter) {
      case 'continueWithAll':
        localStorage.setItem('currentFilters', JSON.stringify(""));
        break;

      case 'continueWithCurr':
        // filter set already
        break;

      case 'continueWithAllFromNow':
        localStorage.setItem('currentFilters', JSON.stringify(""));
        localStorage.setItem('currentPeriod', JSON.stringify('from-now'));
        localStorage.setItem('currentFromNowTimestamp', JSON.stringify(new Date().getTime())); 
        break;

      default:
        break;
    }

    return () => this.dialogRef.close(this.router.navigateByUrl('/participant/room/' + localStorage.getItem('roomId') + '/comments/tagcloud'));
  }
}
