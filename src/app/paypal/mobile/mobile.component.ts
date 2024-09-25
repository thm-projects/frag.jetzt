import { Component } from '@angular/core';

import { M3BodyPaneComponent } from 'modules/m3/components/layout/m3-body-pane/m3-body-pane.component';
import { M3SupportingPaneComponent } from 'modules/m3/components/layout/m3-supporting-pane/m3-supporting-pane.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { NgClass, NgForOf } from '@angular/common';
import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';

// Load the i18n data
const i18n = I18nLoader.load(rawI18n);

// Define type for pricing plans

@Component({
  selector: 'app-mobile',
  standalone: true,
  imports: [
    M3BodyPaneComponent,
    M3SupportingPaneComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    NgClass,
    NgForOf,
  ],
  templateUrl: './mobile.component.html',
  styleUrls: ['./mobile.component.scss'],
})
export class MobileComponent {
  protected readonly i18n = i18n;
  userTokens = 100;
}
