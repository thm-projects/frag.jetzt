import { Component, OnInit } from '@angular/core';
import { Room } from '../../../models/room';
import { Location } from '@angular/common';
import { RoomService } from '../../../services/http/room.service';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';

@Component({
  selector: 'app-room-participant-page',
  templateUrl: './room-participant-page.component.html',
  styleUrls: ['./room-participant-page.component.scss']
})
export class RoomParticipantPageComponent implements OnInit {

  room: Room;
  isLoading = true;
  themeClass = localStorage.getItem('classNameOfTheme');

  constructor(private location: Location,
              private roomService: RoomService,
              private route: ActivatedRoute,
              private translateService: TranslateService,
              protected langService: LanguageService) {
    langService.langEmitter.subscribe(lang => translateService.use(lang));
  }

  ngOnInit() {
    window.scroll(0, 0);
    this.route.params.subscribe(params => {
      this.getRoom(params['roomId']);
    });
    this.translateService.use(localStorage.getItem('currentLang'));
  }

  getRoom(id: string): void {
    this.roomService.getRoomByShortId(id)
      .subscribe(room => {
        this.room = room;
        this.isLoading = false;
      });
  }
}
