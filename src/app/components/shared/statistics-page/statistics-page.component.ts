import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RoomService } from '../../../services/http/room.service';
import { ContentGroup } from '../../../models/content-group';
import { Room } from '../../../models/room';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics-page.component.html',
  styleUrls: ['./statistics-page.component.scss']
})

export class StatisticsPageComponent implements OnInit {

  room: Room;
  contentGroups: ContentGroup[];

  constructor(
    private route: ActivatedRoute,
    private roomService: RoomService,
    private translateService: TranslateService,
    protected langService: LanguageService) {
    langService.langEmitter.subscribe(lang => translateService.use(lang));
  }

  ngOnInit(): void {
    this.getRoom(localStorage.getItem('roomId'));
  }

  getRoom(id: string): void {
    this.translateService.use(localStorage.getItem('currentLang'));
    this.roomService.getRoom(id).subscribe(room => {
      this.contentGroups = room.contentGroups;
    });
  }

}
