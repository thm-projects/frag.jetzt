import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';

@Component({
  selector: 'app-data-protection',
  templateUrl: './data-protection.component.html',
  styleUrls: ['./data-protection.component.scss']
})
export class DataProtectionComponent implements OnInit {

  deviceType: string;
  dataprotectiontext: string;

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
    this.getDataProtectionTextByLanguage();
  }

  checkForLanguageChange() {
    this.languageService.langEmitter.subscribe(() => this.getDataProtectionTextByLanguage());
  }


  private getDataProtectionTextByLanguage() {
    if (localStorage.getItem('currentLang') === 'de') {
      this.dataprotectiontext = 'Datenschutzerklärung wird angezeigt';
    } else if (localStorage.getItem('currentLang') === 'en') {
      this.dataprotectiontext = 'Data protection text is displayed';
    } else {
      this.dataprotectiontext = 'No such language found.';
    }
  }
}
