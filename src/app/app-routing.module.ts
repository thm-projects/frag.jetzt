import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PageNotFoundComponent } from './components/pages/page-not-found/page-not-found.component';
import { LoginScreenComponent } from './components/pages/login/login.component';
import { CreatorHomeScreenComponent } from './components/pages/home-creator/home-creator.component';
import { CreateCommentComponent } from './components/pages/comment-create/comment-create.component';
import { ParticipantHomeScreenComponent } from './components/pages/home-participant/home-participant.component';
import { AuthenticationGuard } from './guards/authentication.guard';
import { UserRole } from './models/user-roles.enum';
import { ParticipantRoomComponent } from './components/pages/room-participant/room-participant.component';
import { CreatorRoomComponent } from './components/pages/room-creator/room-creator.component';
import { CommentListComponent } from './components/fragments/comment-list/comment-list.component';
import { ContentListComponent } from './components/fragments/content-list/content-list.component';
import { AnswerStatisticsComponent } from './components/fragments/statistics/statistics.component';
import { AddContentComponent } from './components/pages/content-create/content-create.component';
import {
  ParticipantContentCarouselPageComponent
} from './components/pages/content-carousel/content-carousel.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: LoginScreenComponent
  },
  {
    path: 'creator',
    component: CreatorHomeScreenComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.CREATOR] }
  },
  {
    path: 'creator/room/:roomId',
    component: CreatorRoomComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.CREATOR] }
  },
  {
    path: 'creator/room/:roomId/content-create',
    component: AddContentComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.CREATOR] }
  },
  {
    path: 'creator/room/:roomId/statistics',
    component: AnswerStatisticsComponent,
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
    path: 'creator/room/:roomId/content',
    component: ContentListComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.CREATOR] }
  },
  {
    path: 'participant',
    component: ParticipantHomeScreenComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.PARTICIPANT] }
  },
  {
    path: 'participant/room/:roomId',
    component: ParticipantRoomComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.PARTICIPANT] }
  },
  {
    path: 'participant/room/:roomId/comment-create',
    component: CreateCommentComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.PARTICIPANT] }
  },
  {
    path: 'participant/room/:roomId/questions',
    component: ParticipantContentCarouselPageComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.PARTICIPANT] }
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
