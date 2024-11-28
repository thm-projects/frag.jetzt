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
  standalone: false,
})
export class JoyrideTemplateComponent implements OnInit, OnDestroy {
  @ViewChild('nextButton', { static: true }) nextButton: TemplateRef<unknown>;
  @ViewChild('prevButton', { static: true }) prevButton: TemplateRef<unknown>;
  @ViewChild('doneButton', { static: true }) doneButton: TemplateRef<unknown>;
  @ViewChild('counter', { static: true }) counter: TemplateRef<unknown>;

  @Input() name: string;

  title$ = new ReplaySubject<string>();
  text$ = new ReplaySubject<string>();

  private destroyer = new ReplaySubject<void>(1);

  constructor(
    private eventService: EventService,
    private translateService: TranslateService,
    private onboardingService: OnboardingService,
  ) {}

  ngOnInit(): void {
    this.translateService
      .stream(`joyride.${this.name}Title`)
      .pipe(takeUntil(this.destroyer))
      .subscribe((title) => this.title$.next(title));
    this.translateService
      .stream(`joyride.${this.name}`)
      .pipe(takeUntil(this.destroyer))
      .subscribe((translation) => this.text$.next(translation));
  }

  ngOnDestroy(): void {
    this.destroyer.next();
    this.destroyer.complete();
    this.title$.complete();
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
