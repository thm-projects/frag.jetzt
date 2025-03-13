import { Component, inject, Injector, OnInit } from '@angular/core';

import { M3BodyPaneComponent } from 'modules/m3/components/layout/m3-body-pane/m3-body-pane.component';
import { M3SupportingPaneComponent } from 'modules/m3/components/layout/m3-supporting-pane/m3-supporting-pane.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { NgClass, NgForOf } from '@angular/common';
import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
import { applyDefaultNavigation } from 'app/navigation/default-navigation';
import { MatListModule } from '@angular/material/list';
import { ContextPipe } from 'app/base/i18n/context.pipe';
import { CustomMarkdownModule } from 'app/base/custom-markdown/custom-markdown.module';
import { user$, forceLogin, user, openLogin } from 'app/user/state/user';
import { User } from 'app/models/user';
// Load the i18n data
const i18n = I18nLoader.load(rawI18n);

// Define type for pricing plans
interface Plan {
  title: string;
  price: string;
  tokens: number;
  color: string;
}

@Component({
  selector: 'app-mobile',
  imports: [
    M3BodyPaneComponent,
    M3SupportingPaneComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    NgClass,
    NgForOf,
    MatListModule,
    ContextPipe,
    CustomMarkdownModule,
  ],
  templateUrl: './mobile.component.html',
  styleUrls: ['./mobile.component.scss'],
})
export class MobileComponent implements OnInit {
  protected readonly i18n = i18n;
  userTokens = 0;
  private injector = inject(Injector);

  // Pricing plans
  plans: Plan[] = [
    {
      title: 'Free Plan',
      price: '0',
      tokens: 50000,
      color: 'grey',
    },
    { title: '€5 Plan', price: '5', tokens: 50000, color: 'primary' },
    { title: '€10 Plan', price: '10', tokens: 106000, color: 'primary' },
    { title: '€20 Plan', price: '20', tokens: 212000, color: 'primary' },
    { title: '€50 Plan', price: '50', tokens: 530000, color: 'primary' },
  ];

  constructor() {
    applyDefaultNavigation(this.injector).subscribe();
  }
  user: User;
  ngOnInit() {
    this.getUserTokens();
    user$.subscribe((u) => (this.user = u));
  }

  loginPage() {
    if (!user()) {
      forceLogin().subscribe();
    } else if (user().isGuest) {
      openLogin().subscribe();
    }
  }

  getUserTokens() {
    // Simulate retrieving the user's token count from a service or backend
    this.userTokens = 50000; // Example token count, replace with actual value
  }
}
