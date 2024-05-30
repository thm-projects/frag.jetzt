import { Component } from '@angular/core';
import { language } from 'app/base/language/language';

@Component({
  selector: 'app-ask-onboarding',
  templateUrl: './ask-onboarding.component.html',
  styleUrls: ['./ask-onboarding.component.scss'],
})
export class AskOnboardingComponent {
  protected readonly lang = language;
}
