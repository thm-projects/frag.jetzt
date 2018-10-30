import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginPageComponent } from './components/login-page/login-page.component';
import { FooterImprintComponent } from './components/shared/footer-imprint/footer-imprint.component';
import { PageNotFoundComponent } from './components/shared/page-not-found/page-not-found.component';
import { CreatorModule } from './components/creator/creator.module';
import { ParticipantModule } from './components/participant/participant.module';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: LoginPageComponent
  },
  {
    path: 'creator',
    loadChildren: () => CreatorModule
  },
  {
    path: 'participant',
    loadChildren: () => ParticipantModule
  },
  {
    path: 'imprint',
    component: FooterImprintComponent
  },
  {
    path: '**',
    component: PageNotFoundComponent
  }
];


@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule {
}
