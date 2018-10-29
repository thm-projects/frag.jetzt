import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PageNotFoundComponent } from './components/shared/page-not-found/page-not-found.component';
import { LoginPageComponent } from './components/shared/login-page/login-page.component';
import { HomeCreatorPageComponent } from './components/creator/home-creator-page/home-creator-page.component';
import { CommentCreatePageComponent } from './components/creator/comment-create-page/comment-create-page.component';
import { HomeParticipantPageComponent } from './components/participant/home-participant-page/home-participant-page.component';
import { AuthenticationGuard } from './guards/authentication.guard';
import { UserRole } from './models/user-roles.enum';
import { RoomParticipantPageComponent } from './components/participant/room-participant-page/room-participant-page.component';
import { RoomCreatorPageComponent } from './components/creator/room-creator-page/room-creator-page.component';
import { CommentListComponent } from './components/shared/comment-list/comment-list.component';
import { ContentListComponent } from './components/shared/content-list/content-list.component';
import { StatisticsComponent } from './components/shared/statistics/statistics.component';
import { ContentCreatePageComponent } from './components/creator/content-create-page/content-create-page.component';
import { ContentCarouselPageComponent } from './components/shared/content-carousel-page/content-carousel-page.component';
import { FeedbackBarometerPageComponent } from './components/shared/feedback-barometer-page/feedback-barometer-page.component';
import { FooterImprintComponent } from './components/shared/footer-imprint/footer-imprint.component';

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
    component: HomeCreatorPageComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.CREATOR] }
  },
  {
    path: 'creator/room/:roomId',
    component: RoomCreatorPageComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.CREATOR] }
  },
  {
    path: 'creator/room/:roomId/create-content',
    component: ContentCreatePageComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.CREATOR] }
  },
  {
    path: 'creator/room/:roomId/statistics',
    component: StatisticsComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.CREATOR] }
  },
  {
    path: 'creator/room/:roomId/comments',
    component: CommentListComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.CREATOR] }
  },
  {
    path: 'creator/room/:roomId/feedback-barometer',
    component: FeedbackBarometerPageComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.CREATOR] }
  },
  {
    path: 'creator/room/:roomId/contents',
    component: ContentCarouselPageComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.CREATOR] }
  },
  {
    path: 'creator/room/:roomId/:contentGroup',
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
    path: 'participant/room/:roomId',
    component: RoomParticipantPageComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.PARTICIPANT] }
  },
  {
    path: 'participant/room/:roomId/create-comment',
    component: CommentCreatePageComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.PARTICIPANT] }
  },
  {
    path: 'participant/room/:roomId/feedback-barometer',
    component: FeedbackBarometerPageComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.PARTICIPANT] }
  },
  {
    path: 'participant/room/:roomId/:contentGroup',
    component: ContentCarouselPageComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.PARTICIPANT] }
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
