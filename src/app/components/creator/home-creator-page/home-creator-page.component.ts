import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { RoomCreateComponent } from '../_dialogs/room-create/room-create.component';
import { TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-home-creator-page',
  templateUrl: './home-creator-page.component.html',
  styleUrls: ['./home-creator-page.component.scss']
})

export class HomeCreatorPageComponent implements OnInit {
  constructor(public dialog: MatDialog,
              private translateService: TranslateService) {
  }

  ngOnInit() {
    this.translateService.use(sessionStorage.getItem('currentLang'));
  }

  openCreateRoomDialog(): void {
    this.dialog.open(RoomCreateComponent, {
      width: '350px'
    });
  }
}
