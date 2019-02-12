import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FooterImprintComponent } from './components/shared/footer-imprint/footer-imprint.component';
import { PageNotFoundComponent } from './components/shared/page-not-found/page-not-found.component';
import { CreatorModule } from './components/creator/creator.module';
import { ParticipantModule } from './components/participant/participant.module';
import { HomePageComponent } from './components/home/home-page/home-page.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: HomePageComponent
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
