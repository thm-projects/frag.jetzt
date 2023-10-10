import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthenticationGuard } from '../../guards/authentication.guard';
import { UserRole } from '../../models/user-roles.enum';
import { RoomCreatorPageComponent } from './room-creator-page/room-creator-page.component';
import { CommentPageComponent } from '../shared/comment-page/comment-page.component';
import { CommentAnswerComponent } from '../shared/comment-answer/comment-answer.component';

const routes: Routes = [
  {
    path: 'room/:shortId',
    component: RoomCreatorPageComponent,
    canActivate: [AuthenticationGuard],
    data: {
      roles: [
        UserRole.CREATOR,
        UserRole.EXECUTIVE_MODERATOR,
        UserRole.PARTICIPANT,
      ],
    },
  },
  {
    path: 'room/:shortId/comments',
    component: CommentPageComponent,
    canActivate: [AuthenticationGuard],
    data: {
      roles: [
        UserRole.CREATOR,
        UserRole.EXECUTIVE_MODERATOR,
        UserRole.PARTICIPANT,
      ],
    },
  },
  {
    path: 'room/:shortId/comment/:commentId',
    component: CommentAnswerComponent,
    canActivate: [AuthenticationGuard],
    data: {
      roles: [
        UserRole.CREATOR,
        UserRole.EXECUTIVE_MODERATOR,
        UserRole.PARTICIPANT,
      ],
    },
  },
  {
    path: 'room/:shortId/comment/:commentId/conversation',
    component: CommentAnswerComponent,
    canActivate: [AuthenticationGuard],
    data: {
      roles: [
        UserRole.CREATOR,
        UserRole.EXECUTIVE_MODERATOR,
        UserRole.PARTICIPANT,
      ],
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CreatorRoutingModule {}
