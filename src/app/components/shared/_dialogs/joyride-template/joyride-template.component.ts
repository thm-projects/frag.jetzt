import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { EventService } from '../../../../services/util/event.service';
import { OnboardingService } from '../../../../services/util/onboarding.service';
import { ReplaySubject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-joyride-template',
  templateUrl: './joyride-template.component.html',
  styleUrls: ['./joyride-template.component.scss'],
})
export class JoyrideTemplateComponent implements OnInit, OnDestroy {
  @ViewChild('translateText', { static: true }) translateText: TemplateRef<any>;
  @ViewChild('nextButton', { static: true }) nextButton: TemplateRef<any>;
  @ViewChild('prevButton', { static: true }) prevButton: TemplateRef<any>;
  @ViewChild('doneButton', { static: true }) doneButton: TemplateRef<any>;
  @ViewChild('counter', { static: true }) counter: TemplateRef<any>;

  @Input() name: string;

  title: string;
  text: string;

  private destroyer = new ReplaySubject(1);

  constructor(
    private eventService: EventService,
    private translateService: TranslateService,
    private onboardingService: OnboardingService,
  ) {}

  ngOnInit(): void {
    this.translateService
      .stream(`joyride.${this.name}Title`)
      .pipe(takeUntil(this.destroyer))
      .subscribe((translation) => (this.title = translation));
    this.translateService
      .stream(`joyride.${this.name}`)
      .pipe(takeUntil(this.destroyer))
      .subscribe((translation) => (this.text = translation));
  }

  ngOnDestroy(): void {
    this.destroyer.next(true);
    this.destroyer.complete();
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
