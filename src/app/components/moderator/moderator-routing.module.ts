import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthenticationGuard } from '../../guards/authentication.guard';
import { UserRole } from '../../models/user-roles.enum';
import { CommentPageComponent } from '../shared/comment-page/comment-page.component';
import { ModeratorCommentPageComponent } from './moderator-comment-page/moderator-comment-page.component';
import { CommentAnswerComponent } from '../shared/comment-answer/comment-answer.component';
import { ModeratorJoinComponent } from './moderator-join/moderator-join.component';
import { RoomPageComponent } from 'app/room/room-page/room-page.component';

const routes: Routes = [
  {
    path: 'room/:shortId',
    component: RoomPageComponent,
    canActivate: [AuthenticationGuard],
    data: {
      roles: [
        UserRole.EXECUTIVE_MODERATOR,
        UserRole.CREATOR,
        UserRole.PARTICIPANT,
      ],
    },
    title: 'ROOM',
  },
  {
    path: 'room/:shortId/comments',
    component: CommentPageComponent,
    canActivate: [AuthenticationGuard],
    data: {
      roles: [
        UserRole.EXECUTIVE_MODERATOR,
        UserRole.CREATOR,
        UserRole.PARTICIPANT,
      ],
    },
    title: 'COMMENTS',
  },
  {
    path: 'room/:shortId/moderator/comments',
    component: ModeratorCommentPageComponent,
    canActivate: [AuthenticationGuard],
    data: {
      roles: [UserRole.EXECUTIVE_MODERATOR, UserRole.CREATOR],
    },
    title: 'MODERATOR',
  },
  {
    path: 'room/:shortId/comment/:commentId',
    component: CommentAnswerComponent,
    canActivate: [AuthenticationGuard],
    data: {
      roles: [
        UserRole.EXECUTIVE_MODERATOR,
        UserRole.CREATOR,
        UserRole.PARTICIPANT,
      ],
    },
    title: 'COMMENT',
  },
  {
    path: 'room/:shortId/comment/:commentId/conversation',
    component: CommentAnswerComponent,
    canActivate: [AuthenticationGuard],
    data: {
      roles: [
        UserRole.EXECUTIVE_MODERATOR,
        UserRole.CREATOR,
        UserRole.PARTICIPANT,
      ],
    },
    title: 'CONVERSATION',
  },
  {
    path: 'join/:shortId',
    component: ModeratorJoinComponent,
    title: 'MODERATOR_JOIN',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ModeratorRoutingModule {}
