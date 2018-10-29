import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginPageComponent } from './components/shared/login-page/login-page.component';
import { FooterImprintComponent } from './components/shared/footer-imprint/footer-imprint.component';
import { PageNotFoundComponent } from './components/shared/page-not-found/page-not-found.component';

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
    loadChildren: './components/creator/creator.module#CreatorModule'
  },
  {
    path: 'participant',
    loadChildren: './components/participant/participant.module#ParticipantModule'
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
  ],
  declarations: []
})
export class AppRoutingModule {
}
