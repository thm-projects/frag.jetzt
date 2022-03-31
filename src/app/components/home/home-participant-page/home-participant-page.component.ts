import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';

@Component({
  selector: 'app-home-participant-page',
  templateUrl: './home-participant-page.component.html',
  styleUrls: ['./home-participant-page.component.scss']
})
export class HomeParticipantPageComponent implements OnInit {

  constructor(private translateService: TranslateService,
              protected langService: LanguageService) {
    langService.getLanguage().subscribe(lang => translateService.use(lang));
  }

  ngOnInit() {
  }

}
