import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { RoomService } from '../../../services/http/room.service';
import { ActivatedRoute } from '@angular/router';
import { ContentGroup } from '../../../models/content-group';

@Component({
  selector: 'app-content-create-page',
  templateUrl: './content-create-page.component.html',
  styleUrls: ['./content-create-page.component.scss']
})
export class ContentCreatePageComponent implements OnInit {

  contentGroups: ContentGroup[];
  lastCollection: string;

  constructor(private translateService: TranslateService,
              protected langService: LanguageService,
              protected roomService: RoomService,
              protected route: ActivatedRoute) {
    langService.langEmitter.subscribe(lang => translateService.use(lang));
  }

  ngOnInit() {
    this.translateService.use(sessionStorage.getItem('currentLang'));
    this.route.params.subscribe(params => {
      this.getGroups(params['roomId']);
    });
    this.lastCollection = sessionStorage.getItem('collection');
  }

  getGroups(id: string): void {
    this.roomService.getRoomByShortId(id).subscribe(room => {
    });
  }
}
