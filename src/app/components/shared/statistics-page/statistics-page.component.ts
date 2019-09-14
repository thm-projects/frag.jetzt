import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RoomService } from '../../../services/http/room.service';
import { ContentGroup } from '../../../models/content-group';
import { Room } from '../../../models/room';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { MatTabGroup, MatDialog } from '@angular/material';
import { StatisticHelpComponent } from '../_dialogs/statistic-help/statistic-help.component';
import { NotificationService } from '../../../services/util/notification.service';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics-page.component.html',
  styleUrls: ['./statistics-page.component.scss']
})

export class StatisticsPageComponent implements OnInit {

  room: Room;
  contentGroups: ContentGroup[];
  isLoading = true;
  currentCG: string;

  @ViewChild(MatTabGroup) tabGroup: MatTabGroup;

  constructor(private route: ActivatedRoute,
              private roomService: RoomService,
              private translateService: TranslateService,
              protected langService: LanguageService,
              public dialog: MatDialog,
              private notificationService: NotificationService) {
              langService.langEmitter.subscribe(lang => translateService.use(lang));
  }

  ngOnInit(): void {
    if (sessionStorage.getItem('contentGroup')) {
      this.currentCG = sessionStorage.getItem('contentGroup');
    }
    this.getRoom(localStorage.getItem('roomId'));
    this.tabGroup.selectedIndex = 1;
    this.translateService.use(localStorage.getItem('currentLang'));
  }

  getRoom(id: string): void {
    this.roomService.getRoom(id).subscribe(room => {
      if (this.contentGroups) {
        if (this.currentCG) {
          for (let i = 0; i < this.contentGroups.length; i++) {
            if (this.currentCG.includes(this.contentGroups[i].name)) {
              this.tabGroup.selectedIndex = i;
            }
          }
        }
      } else {
        this.translateService.get('no-questions').subscribe( message => {
          this.notificationService.show(message);
        });
      }
      this.isLoading = false;
    });
  }

  showHelp(): void {
    this.dialog.open(StatisticHelpComponent, {
      width: '350px'
    });
  }

}
