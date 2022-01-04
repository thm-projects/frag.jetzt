import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RoomCreateComponent } from '../../shared/_dialogs/room-create/room-create.component';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';

@Component({
  selector: 'app-home-creator-page',
  templateUrl: './home-creator-page.component.html',
  styleUrls: ['./home-creator-page.component.scss']
})

export class HomeCreatorPageComponent implements OnInit {
  constructor(public dialog: MatDialog,
              private translateService: TranslateService,
              protected langService: LanguageService) {
    langService.getLanguage().subscribe(lang => translateService.use(lang));
  }

  ngOnInit() {
  }

  openCreateRoomDialog(): void {
    this.dialog.open(RoomCreateComponent, {
      width: '350px'
    });
  }
}
