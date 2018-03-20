import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PageNotFoundComponent } from './components/pages/page-not-found/page-not-found.component';
import { LoginScreenComponent } from './components/pages/login-screen/login-screen.component';
import { CreatorHomeScreenComponent } from './components/pages/creator-home-screen/creator-home-screen.component';
import { CreateCommentComponent } from './components/pages/create-comment/create-comment.component';
import { ParticipantHomeScreenComponent } from './components/pages/participant-home-screen/participant-home-screen.component';
import { AuthenticationGuard } from './guards/authentication.guard';
import { UserRole } from './models/user-roles.enum';
import { ParticipantRoomComponent } from './components/pages/participant-room/participant-room.component';
import { CreatorRoomComponent } from './components/pages/creator-room/creator-room.component';
import { CommentListComponent } from './components/fragments/comment-list/comment-list.component';
import { ContentListComponent } from './components/fragments/content-list/content-list.component';
import { ContentDetailComponent } from './components/pages/content-detail/content-detail.component';
import { AnswerStatisticsComponent } from './components/fragments/statistics/statistics.component';
import { AddContentComponent } from './components/pages/add-content/add-content.component';
import {
  ParticipantContentCarouselPageComponent
} from './components/pages/participant-content-carousel-page/participant-content-carousel-page.component';

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
    path: 'creator/room/:roomId/add-content',
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
    path: 'creator/room/:roomId/content/:contentId',
    component: ContentDetailComponent,
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
    path: 'participant/room/:roomId/create-comment',
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
