import {Component, Inject, OnInit, Input} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {NotificationService} from '../../../../services/util/notification.service';
import {TranslateService} from '@ngx-translate/core';
import {RoomCreatorPageComponent} from '../../../creator/room-creator-page/room-creator-page.component';
import {LanguageService} from '../../../../services/util/language.service';
import {EventService} from '../../../../services/util/event.service';
import {ActivatedRoute, Router} from '@angular/router';
import { CommentFilterOptions } from '../../../../utils/filter-options';

@Component({
  selector: 'app-topic-cloud-filter',
  templateUrl: './topic-cloud-filter.component.html',
  styleUrls: ['./topic-cloud-filter.component.scss']
})
export class TopicCloudFilterComponent implements OnInit {
  @Input() filteredComments: any;
  @Input() commentsFilteredByTime: any;

  continueFilter = 'continueWithCurr';

  tmpFilter : CommentFilterOptions;
  shortId: string;
  
  constructor(public dialogRef: MatDialogRef<RoomCreatorPageComponent>,
              public dialog: MatDialog,
              public notificationService: NotificationService,
              public translationService: TranslateService,
              protected langService: LanguageService,
              private route: ActivatedRoute,
              private router: Router,
              @Inject(MAT_DIALOG_DATA) public data: any,
              public eventService: EventService) {
    langService.langEmitter.subscribe(lang => translationService.use(lang));
  }

  ngOnInit() {
    this.translationService.use(localStorage.getItem('currentLang'));
    this.tmpFilter = CommentFilterOptions.readFilter();
    localStorage.setItem("filtertmp", JSON.stringify(this.tmpFilter));
    this.route.params.subscribe(params => {
      this.shortId = params['shortId'];
    });
  }

  closeDialog(): void {
  }


  cancelButtonActionCallback(): () => void {
    return () => this.dialogRef.close('abort');
  }

  confirmButtonActionCallback(): () => void {
    let filter : CommentFilterOptions;

    switch (this.continueFilter) {
      case 'continueWithAll':
        filter = new CommentFilterOptions(); // all questions allowed
        break;
  
      case 'continueWithAllFromNow':
        filter = CommentFilterOptions.generateFilterNow(this.tmpFilter.filterSelected);
        break;
          
      case 'continueWithCurr':
        filter = JSON.parse(localStorage.getItem("filtertmp")) as CommentFilterOptions;
        break;

      default:
        return;
    }

    CommentFilterOptions.writeFilterStatic(filter);
    return () => this.dialogRef.close(this.router.navigateByUrl('/participant/room/' + this.shortId + '/comments/tagcloud'));
  }
}
