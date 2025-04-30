import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserRole } from '../../models/user-roles.enum';
import { CommentPageComponent } from '../shared/comment-page/comment-page.component';
import { CommentAnswerComponent } from '../shared/comment-answer/comment-answer.component';
import { RoomPageComponent } from 'app/room/room-page/room-page.component';
import { AuthenticationGuard } from 'app/guards/authentication.guard';

const routes: Routes = [
  {
    path: 'room/:shortId',
    component: RoomPageComponent,
    canActivate: [AuthenticationGuard],
    data: {
      roles: [
        UserRole.PARTICIPANT,
        UserRole.CREATOR,
        UserRole.EXECUTIVE_MODERATOR,
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
        UserRole.PARTICIPANT,
        UserRole.CREATOR,
        UserRole.EXECUTIVE_MODERATOR,
      ],
    },
    title: 'COMMENTS',
  },
  {
    path: 'room/:shortId/comment/:commentId',
    component: CommentAnswerComponent,
    canActivate: [AuthenticationGuard],
    data: {
      roles: [
        UserRole.PARTICIPANT,
        UserRole.CREATOR,
        UserRole.EXECUTIVE_MODERATOR,
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
        UserRole.PARTICIPANT,
        UserRole.CREATOR,
        UserRole.EXECUTIVE_MODERATOR,
      ],
    },
    title: 'CONVERSATION',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ParticipantRoutingModule {}
