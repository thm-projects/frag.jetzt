import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PageNotFoundComponent } from './components/shared/page-not-found/page-not-found.component';
import { HomePageComponent } from './components/home/home-page/home-page.component';
import { UserHomeComponent } from './components/home/user-home/user-home.component';
import { ImprintComponent } from './components/home/_dialogs/imprint/imprint.component';
import { DataProtectionComponent } from './components/home/_dialogs/data-protection/data-protection.component';

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
    path: 'user',
    component: UserHomeComponent
  },
  {
    path: 'imprint',
    component: ImprintComponent
  },
  {
    path: 'data-protection',
    component: DataProtectionComponent
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
    path: 'moderator',
    loadChildren: './components/moderator/moderator.module#ModeratorModule'
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
