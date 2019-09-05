import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';

@Component({
  selector: 'app-help',
  templateUrl: './help-page.component.html',
  styleUrls: ['./help-page.component.scss']
})
export class HelpPageComponent implements OnInit {

  deviceType: string;
  helptext: string;

  constructor(private location: Location,
              private translationService: TranslateService,
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
    this.getHelptextByLanguage();
    this.checkForLanguageChange();
  }

  getHelptextByLanguage() {
    if (localStorage.getItem('currentLang') === 'de') {
      this.helptext = 'Das ist deutsch';
      console.log('0');
    } else if (localStorage.getItem('currentLang') === 'en') {
      this.helptext = 'This is english';
      console.log('1');
    } else {
      this.helptext = 'No such language found.';
      console.log('-1');
    }
  }

  checkForLanguageChange() {
    this.languageService.langEmitter.subscribe(() => this.getHelptextByLanguage());
  }

  goBack() {
   this.location.back();
 }
}
