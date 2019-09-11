import { Component, Input, OnInit } from '@angular/core';
import { ContentText } from '../../../models/content-text';
import { FormControl } from '@angular/forms';
import { Room } from '../../../models/room';
import { TranslateService } from '@ngx-translate/core';
import { EventService } from '../../../services/util/event.service';

@Component({
  selector: 'app-content-creator',
  templateUrl: './content-creator.component.html',
  styleUrls: ['./content-creator.component.scss']
})
export class ContentCreatorComponent implements OnInit {
  @Input() format;
  @Input() contentGroups;

  room: Room;

  lastCollection: string;

  content: ContentText = new ContentText(
    '1',
    '1',
    '0',
    '',
    '',
    1,
    [],
  );

  myControl = new FormControl();

  editDialogMode = false;

  constructor(private translateService: TranslateService,
              public eventService: EventService) {
  }

  ngOnInit() {
    this.translateService.use(localStorage.getItem('currentLang'));
    this.lastCollection = sessionStorage.getItem('collection');
  }

  resetInputs() {
    this.content.subject = '';
    this.content.body = '';
  }
}
