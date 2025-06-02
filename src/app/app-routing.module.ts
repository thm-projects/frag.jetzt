import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './components/home/home-page/home-page.component';
import { UserHomePageComponent } from './components/home/user-home-page/user-home-page.component';
import { ImprintComponent } from './components/home/_dialogs/imprint/imprint.component';
import { DataProtectionComponent } from './components/home/_dialogs/data-protection/data-protection.component';
import { QuizNowComponent } from './components/shared/quiz-now/quiz-now.component';
import { DemoVideoComponent } from './components/home/_dialogs/demo-video/demo-video.component';
import { PaymentRouteComponent } from './paypal/payment-route/payment-route.component';
import { TransactionComponent } from './paypal/transaction/transaction.component';
import { UserOverviewComponent } from './user/user-overview/user-overview.component';
import { APISetupComponent } from './user/apisetup/apisetup.component';
import { PageNotFoundComponent } from './components/shared/page-not-found/page-not-found.component';

/**
 * Routing configuration with title keys for internationalization.
 *
 * The title properties are used by TitleStrategy classes
 * to find the corresponding translations.
 */
const routes: Routes = [
  {
    path: '',
    component: HomePageComponent,
    title: 'HOME', // Changed: Using uppercase as convention for translation keys
  },
  {
    path: 'home',
    component: HomePageComponent,
    title: 'HOME',
  },
  {
    path: 'user',
    component: UserHomePageComponent,
    title: 'USER_DASHBOARD',
  },
  {
    path: 'user/overview',
    component: UserOverviewComponent,
    title: 'USER_OVERVIEW',
  },
  {
    path: 'user/api-setup',
    component: APISetupComponent,
    title: 'API_SETUP',
    data: {
      mode: 'user',
    },
  },
  {
    path: 'imprint',
    component: ImprintComponent,
    title: 'IMPRINT',
  },
  {
    path: 'introduction',
    component: DemoVideoComponent,
    title: 'INTRODUCTION',
  },
  {
    path: 'data-protection',
    component: DataProtectionComponent,
    title: 'DATA_PROTECTION',
  },
  {
    path: 'quiz',
    component: QuizNowComponent,
    title: 'QUIZ',
  },
  {
    path: 'purchase',
    component: PaymentRouteComponent,
    title: 'PURCHASE',
  },
  {
    path: 'transaction',
    component: TransactionComponent,
    title: 'TRANSACTION',
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./components/admin/admin.module').then((m) => m.AdminModule),
    title: 'ADMIN_PORTAL',
  },
  {
    path: 'creator',
    loadChildren: () =>
      import('./components/creator/creator.module').then(
        (m) => m.CreatorModule,
      ),
    title: 'CREATOR',
  },
  {
    path: 'participant',
    loadChildren: () =>
      import('./components/participant/participant.module').then(
        (m) => m.ParticipantModule,
      ),
    title: 'PARTICIPANT',
  },
  {
    path: 'moderator',
    loadChildren: () =>
      import('./components/moderator/moderator.module').then(
        (m) => m.ModeratorModule,
      ),
    title: 'MODERATOR',
  },
  {
    path: '**',
    component: PageNotFoundComponent,
    title: 'NOT_FOUND',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {})],
  exports: [RouterModule],
})
export class AppRoutingModule {}
