import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PageNotFoundPageComponent } from './components/pages/page-not-found-page/page-not-found-page.component';
import { LoginComponentPage } from './components/pages/login-page/login-page.component';
import { HomeCreatorPageComponent } from './components/pages/home-creator-page/home-creator-page.component';
import { CommentCreatePageComponent } from './components/pages/comment-create-page/comment-create-page.component';
import { HomeParticipantPageComponent } from './components/pages/home-participant-page/home-participant-page.component';
import { AuthenticationGuard } from './guards/authentication.guard';
import { UserRole } from './models/user-roles.enum';
import { RoomParticipantPageComponent } from './components/pages/room-participant-page/room-participant-page.component';
import { RoomCreatorPageComponent } from './components/pages/room-creator-page/room-creator-page.component';
import { CommentListComponent } from './components/fragments/comment-list/comment-list.component';
import { ContentListComponent } from './components/fragments/content-list/content-list.component';
import { StatisticsComponent } from './components/fragments/statistics/statistics.component';
import { ContentCreatePageComponent } from './components/pages/content-create-page/content-create-page.component';
import {
  ContentCarouselPageComponent
} from './components/pages/content-carousel-page/content-carousel-page.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: LoginComponentPage
  },
  {
    path: 'creator',
    component: HomeCreatorPageComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.CREATOR] }
  },
  {
    path: 'creator/room-page/:roomId',
    component: RoomCreatorPageComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.CREATOR] }
  },
  {
    path: 'creator/room-page/:roomId/content-create-page',
    component: ContentCreatePageComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.CREATOR] }
  },
  {
    path: 'creator/room-page/:roomId/statistics',
    component: StatisticsComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.CREATOR] }
  },
  {
    path: 'creator/room-page/:roomId/comments',
    component: CommentListComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.CREATOR] }
  },
  {
    path: 'creator/room-page/:roomId/content',
    component: ContentListComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.CREATOR] }
  },
  {
    path: 'participant',
    component: HomeParticipantPageComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.PARTICIPANT] }
  },
  {
    path: 'participant/room-page/:roomId',
    component: RoomParticipantPageComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.PARTICIPANT] }
  },
  {
    path: 'participant/room-page/:roomId/comment-create-page',
    component: CommentCreatePageComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.PARTICIPANT] }
  },
  {
    path: 'participant/room-page/:roomId/questions',
    component: ContentCarouselPageComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.PARTICIPANT] }
  },
  {
    path: '**',
    component: PageNotFoundPageComponent
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
