import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.loadModule(rawI18n);
import { Component } from '@angular/core';
import { FlexModule } from '@angular/flex-layout';
import { MatCard, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-frag-jetzt-logo',
  standalone: true,
  imports: [FlexModule, MatCard, MatCardSubtitle, MatCardTitle, MatIconModule],
  templateUrl: './frag-jetzt-logo.component.html',
  styleUrl: './frag-jetzt-logo.component.scss',
})
export class FragJetztLogoComponent {
  protected readonly i18n = i18n;
}
