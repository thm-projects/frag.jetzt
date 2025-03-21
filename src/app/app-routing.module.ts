import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PageNotFoundComponent } from './components/shared/page-not-found/page-not-found.component';
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
const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
    title: 'start',
  },
  {
    path: 'home',
    component: HomePageComponent,
    title: 'home',
  },
  {
    path: 'user',
    component: UserHomePageComponent,
    title: 'user',
  },
  {
    path: 'user/overview',
    component: UserOverviewComponent,
    title: 'user-overview',
  },
  {
    path: 'user/api-setup',
    component: APISetupComponent,
    title: 'api-setup',
  },
  {
    path: 'imprint',
    component: ImprintComponent,
    title: 'imprint',
  },
  {
    path: 'introduction',
    component: DemoVideoComponent,
    title: 'introduction',
  },
  {
    path: 'data-protection',
    component: DataProtectionComponent,
    title: 'data-protection',
  },
  {
    path: 'quiz',
    component: QuizNowComponent,
    title: 'quiz',
  },
  {
    path: 'purchase',
    component: PaymentRouteComponent,
    title: 'purchase',
  },
  {
    path: 'transaction',
    component: TransactionComponent,
    title: 'transaction',
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./components/admin/admin.module').then((m) => m.AdminModule),
    title: 'admin',
  },
  {
    path: 'creator',
    loadChildren: () =>
      import('./components/creator/creator.module').then(
        (m) => m.CreatorModule,
      ),
    title: 'creator',
  },
  {
    path: 'participant',
    loadChildren: () =>
      import('./components/participant/participant.module').then(
        (m) => m.ParticipantModule,
      ),
    title: 'participant',
  },
  {
    path: 'moderator',
    loadChildren: () =>
      import('./components/moderator/moderator.module').then(
        (m) => m.ModeratorModule,
      ),
    title: 'moderator',
  },
  {
    path: '**',
    component: PageNotFoundComponent,
    title: 'not-found',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {})],
  exports: [RouterModule],
})
export class AppRoutingModule {}
