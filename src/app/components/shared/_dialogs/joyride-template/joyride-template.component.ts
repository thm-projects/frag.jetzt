import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { LanguageService } from '../../../../services/util/language.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-joyride-template',
  templateUrl: './joyride-template.component.html',
  styleUrls: ['./joyride-template.component.scss']
})
export class JoyrideTemplateComponent implements OnInit {

  @ViewChild('tempText', { static: true }) tempText: TemplateRef<any>;
  @ViewChild('nextButton', { static: true }) nextButton: TemplateRef<any>;
  @ViewChild('cancelButton', { static: true }) cancelButton: TemplateRef<any>;
  @ViewChild('doneButton', { static: true }) doneButton: TemplateRef<any>;
  @ViewChild('counter', { static: true }) counter: TemplateRef<any>;

  constructor(private langService: LanguageService,
              private translateService: TranslateService) {
    this.langService.langEmitter.subscribe(lang => {
      this.translateService.use(lang);
    });
  }

  ngOnInit(): void {
    this.translateService.use(localStorage.getItem('currentLang'));
  }

}
