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
    title: 'room',
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
    title: 'comments',
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
    title: 'comment',
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
    title: 'conversation',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ParticipantRoutingModule {}
