import { Component } from '@angular/core';
import { FlexModule } from '@angular/flex-layout';
import { MatCard, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-frag-jetzt-logo',
  standalone: true,
  imports: [
    FlexModule,
    MatCard,
    MatCardSubtitle,
    MatCardTitle,
    TranslateModule,
  ],
  templateUrl: './frag-jetzt-logo.component.html',
  styleUrl: './frag-jetzt-logo.component.scss',
})
export class FragJetztLogoComponent {
  constructor(public readonly translate: TranslateService) {}
}
