import {Component, OnInit} from '@angular/core';
import {MatBottomSheetRef} from '@angular/material/bottom-sheet';
import {MatDialog} from '@angular/material/dialog';
import {LanguageService} from '../../../../services/util/language.service';
import {TranslateService} from '@ngx-translate/core';
import {HttpClient} from '@angular/common/http';
import {DashboardNotificationService} from '../../../../services/util/dashboard-notification.service';
import {DeviceInfoService} from '../../../../services/util/device-info.service';
import { DashboardDialogComponent } from '../dashboard-dialog/dashboard-dialog.component';
import { CommentChangeType } from '../../../../models/comment-change';
import { UserRole } from '../../../../models/user-roles.enum';
import { NotificationEvent } from '../../../../models/dashboard-notification';
import { DeleteAllNotificationsComponent } from '../delete-all-notifications/delete-all-notifications.component';
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  toggleFilter: boolean = false;
  hasFilter: boolean = false;
  isNotificationBlocked: boolean = false;
  date: string = new Date().toLocaleDateString('de-DE');
  commentChangeType: typeof CommentChangeType = CommentChangeType;
  userRole: typeof UserRole = UserRole;
  constructor(
              private _bottomSheetRef: MatBottomSheetRef<DashboardComponent>,
              private languageService: LanguageService,
              private translationService: TranslateService,
              public http: HttpClient,
              public dialog: MatDialog,
              public deviceInfo: DeviceInfoService,
              public change: DashboardNotificationService,
              ) {
    this.languageService.getLanguage().subscribe(lang => {
      this.translationService.use(lang);
      this.http.get('/assets/i18n/dashboard/' + lang + '.json')
        .subscribe(translation=>{
          this.translationService.setTranslation(lang, translation, true);
        });
    });
  }

  ngOnInit(): void {
    //intentional
  }

  closeDashboard() {
    this._bottomSheetRef.dismiss();
  }

  toggleNotificationBlock() {
    this.isNotificationBlocked = !this.isNotificationBlocked;
  }

  deleteNotes() {
    this.change.notificationEvents = [];
    this.change.filterList = [];
  }
  showExplanationDashboard() {
    this.dialog.open(DashboardDialogComponent, {
    });
  }

  openDeleteNotifDialog(): void {
    if(this.change.notificationEvents.length === 0) {
      return;
  }
    const dialogRef = this.dialog.open(DeleteAllNotificationsComponent, {
      width: '400px'
    });
    dialogRef.afterClosed()
      .subscribe(result => {
        if (result === 'delete') {
          this.deleteNotes();
        }
      });
  }

  goTo(item: NotificationEvent){
  //route to comment
  }
  filterNotification(msg: string){
    this.hasFilter=true;
    switch (msg) {
      case 'star':
        this.change.filterNotifications(this.commentChangeType.CHANGE_FAVORITE);
        break;
      case 'check_circle':
        this.change.filterNotifications(this.commentChangeType.CHANGE_CORRECT);
        break;
      case 'delete':
        this.change.filterNotifications(this.commentChangeType.DELETED);
        break;
      case 'ban':
        this.change.filterNotifications(this.commentChangeType.CHANGE_ACK);
        break;
      case 'question_answer':
        this.change.filterNotifications(this.commentChangeType.ANSWERED);
        break;
      case 'publish':
        this.change.filterNotifications(this.commentChangeType.CREATED);
        break;
    }
  }
}
