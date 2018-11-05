import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor(private translationService: TranslateService) {

    translationService.setDefaultLang(this.translationService.getBrowserLang());
    sessionStorage.setItem('currentLang', this.translationService.getBrowserLang());
  }

  title = 'ARSnova';
}
