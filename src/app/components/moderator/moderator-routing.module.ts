import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthenticationGuard } from '../../guards/authentication.guard';
import { UserRole } from '../../models/user-roles.enum';
import { RoomModeratorPageComponent } from './room-moderator-page/room-moderator-page.component';
import { CommentPageComponent } from '../shared/comment-page/comment-page.component';
import { ModeratorCommentPageComponent } from './moderator-comment-page/moderator-comment-page.component';
import { CommentAnswerComponent } from '../shared/comment-answer/comment-answer.component';
import { ModeratorJoinComponent } from './moderator-join/moderator-join.component';

const routes: Routes = [
  {
    path: 'room/:shortId',
    component: RoomModeratorPageComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.EXECUTIVE_MODERATOR] },
    title: 'moderator-room-page',
  },
  {
    path: 'room/:shortId/comments',
    component: CommentPageComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.EXECUTIVE_MODERATOR] },
    title: 'moderator-room-comments',
  },
  {
    path: 'room/:shortId/moderator/comments',
    component: ModeratorCommentPageComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.EXECUTIVE_MODERATOR] },
    title: 'moderator-room-moderated-comments',
  },
  {
    path: 'room/:shortId/comment/:commentId',
    component: CommentAnswerComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.EXECUTIVE_MODERATOR] },
    title: 'moderator-room-comment',
  },
  {
    path: 'room/:shortId/comment/:commentId/conversation',
    component: CommentAnswerComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.EXECUTIVE_MODERATOR] },
    title: 'moderator-room-comment-conversation',
  },
  {
    path: 'join/:shortId',
    component: ModeratorJoinComponent,
    title: 'moderator-room-join',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ModeratorRoutingModule {}
