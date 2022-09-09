import { Component, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { EventService } from '../../../../services/util/event.service';
import { OnboardingService } from '../../../../services/util/onboarding.service';
import { Router } from '@angular/router';
import { SessionService } from '../../../../services/util/session.service';

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

  constructor(
    private eventService: EventService,
    private router: Router,
    private translateService: TranslateService,
    private onboardingService: OnboardingService,
    private sessionService: SessionService,
  ) {
  }

  ngOnInit(): void {
    this.sessionService.onReady.subscribe(() => {
      this.translateService.get(`joyride.${this.name}Title`).subscribe(translation => this.title = translation);
      this.translateService.get(`joyride.${this.name}`).subscribe(translation => this.text = translation);
    });
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
