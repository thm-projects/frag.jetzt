import { Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
import { MatIconModule } from '@angular/material/icon';
import { CustomMarkdownModule } from 'app/base/custom-markdown/custom-markdown.module';
import { ContextPipe } from 'app/base/i18n/context.pipe';
const i18n = I18nLoader.load(rawI18n);

@Component({
  selector: 'app-mobiledonation',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    CustomMarkdownModule,
    ContextPipe,
  ],
  templateUrl: './mobiledonation.component.html',
  styleUrl: './mobiledonation.component.scss',
})
export class MobiledonationComponent {
  protected readonly i18n = i18n;
  url = 'https://staging.frag.jetzt/home';
}
