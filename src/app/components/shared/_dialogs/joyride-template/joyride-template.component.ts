import { Component, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { LanguageService } from '../../../../services/util/language.service';
import { TranslateService } from '@ngx-translate/core';
import { EventService } from '../../../../services/util/event.service';
import { OnboardingService } from '../../../../services/util/onboarding.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-joyride-template',
  templateUrl: './joyride-template.component.html',
  styleUrls: ['./joyride-template.component.scss']
})
export class JoyrideTemplateComponent implements OnInit {

  @ViewChild('translateText', { static: true }) translateText: TemplateRef<any>;
  @ViewChild('nextButton', { static: true }) nextButton: TemplateRef<any>;
  @ViewChild('prevButton', { static: true }) prevButton: TemplateRef<any>;
  @ViewChild('doneButton', { static: true }) doneButton: TemplateRef<any>;
  @ViewChild('counter', { static: true }) counter: TemplateRef<any>;

  @Input() name: string;

  title: string;
  text: string;

  constructor(private langService: LanguageService,
              private eventService: EventService,
              private router: Router,
              private translateService: TranslateService,
              private onboardingService: OnboardingService) {
    this.langService.langEmitter.subscribe(lang => {
      this.translateService.use(lang);
    });
  }

  ngOnInit(): void {
    this.translateService.use(localStorage.getItem('currentLang'));
    this.translateService.get(`joyride.${this.name}Title`).subscribe(translation => this.title = translation);
    this.translateService.get(`joyride.${this.name}`).subscribe(translation => this.text = translation);
  }

  finish() {
    this.eventService.broadcast('onboarding', 'finished');
  }

  handle(e: MouseEvent, dir: number) {
    if (this.onboardingService.doStep(dir)) {
      e.preventDefault();
      e.stopPropagation();
    }
    return false;
  }

}
