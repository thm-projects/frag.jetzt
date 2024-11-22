import { Component, inject, Injector } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
import { applyDefaultNavigation } from 'app/navigation/default-navigation';
import rawI18n from './i18n.json';
const i18n = I18nLoader.load(rawI18n);

interface Option {
  title: string;
  content: string; //image?
  route: string;
}

@Component({
  selector: 'app-user-overview',
  imports: [
    MatGridListModule,
    MatCardModule,
    MatButtonModule,
    RouterLink,
    MatIconModule,
  ],
  templateUrl: './user-overview.component.html',
  styleUrl: './user-overview.component.scss',
})
export class UserOverviewComponent {
  protected readonly i18n = i18n;
  private injector = inject(Injector);

  options: Option[] = [
    {
      title: 'i18n().purchase.title',
      content: 'credit_card',
      route: '/purchase',
    },
    { title: 'i18n().myRooms.title', content: 'person', route: '/user' },
    { title: 'i18n().apiKeys.title', content: 'person', route: '/' },
    {
      title: 'i18n().transaction.title',
      content: 'person',
      route: '/transaction',
    },
  ];

  constructor() {
    applyDefaultNavigation(this.injector).subscribe();
  }
}
