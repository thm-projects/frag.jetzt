import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthenticationGuard } from '../../guards/authentication.guard';
import { UserRole } from '../../models/user-roles.enum';
import { RoomParticipantPageComponent } from './room-participant-page/room-participant-page.component';
import { CommentPageComponent } from '../shared/comment-page/comment-page.component';

const routes: Routes = [
  {
    path: 'room/:roomId',
    component: RoomParticipantPageComponent,
    data: { roles: [UserRole.PARTICIPANT] }
  },
  {
    path: 'room/:roomId/comments',
    component: CommentPageComponent,
    data: { roles: [UserRole.PARTICIPANT] }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ParticipantRoutingModule { }
