import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthenticationGuard } from '../../guards/authentication.guard';
import { RoomModeratorPageComponent } from './room-moderator-page/room-moderator-page.component';
import { CommentPageComponent } from '../shared/comment-page/comment-page.component';
import { ModeratorCommentPageComponent } from './moderator-comment-page/moderator-comment-page.component';

const routes: Routes = [
  {
    path: 'room/:roomId',
    component: RoomModeratorPageComponent,
    canActivate: [AuthenticationGuard],
  },
  {
    path: 'room/:roomId/comments',
    component: CommentPageComponent,
    canActivate: [AuthenticationGuard],
  },
  {
    path: 'room/:roomId/moderator/comments',
    component: ModeratorCommentPageComponent,
    canActivate: [AuthenticationGuard],
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ModeratorRoutingModule { }
