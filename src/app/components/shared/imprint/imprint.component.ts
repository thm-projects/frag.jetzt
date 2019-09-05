import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';

@Component({
  selector: 'app-imprint',
  templateUrl: './imprint.component.html',
  styleUrls: ['./imprint.component.scss']
})
export class ImprintComponent implements OnInit {
  deviceType: string;
  imprinttext: string;

  constructor(private translationService: TranslateService,
              private languageService: LanguageService) {
  }

  ngOnInit() {
    if (!localStorage.getItem('currentLang')) {
      const lang = this.translationService.getBrowserLang();
      this.translationService.setDefaultLang(lang);
      localStorage.setItem('currentLang', lang);
    } else {
      this.translationService.setDefaultLang(localStorage.getItem('currentLang'));
    }
    this.checkForLanguageChange();
    this.getImprintByLanguage();
  }

  checkForLanguageChange() {
    this.languageService.langEmitter.subscribe(() => this.getImprintByLanguage());
  }


  private getImprintByLanguage() {
    if (localStorage.getItem('currentLang') === 'de') {
      this.imprinttext = 'Impressum wird angezeigt';
    } else if (localStorage.getItem('currentLang') === 'en') {
      this.imprinttext = 'Imprint is displayed';
    } else {
      this.imprinttext = 'No such language found.';
    }
  }

}
