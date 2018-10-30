import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeParticipantPageComponent } from './home-participant-page/home-participant-page.component';
import { AuthenticationGuard } from '../../guards/authentication.guard';
import { UserRole } from '../../models/user-roles.enum';
import { RoomParticipantPageComponent } from './room-participant-page/room-participant-page.component';
import { CommentCreatePageComponent } from './comment-create-page/comment-create-page.component';
import { FeedbackBarometerPageComponent } from '../shared/feedback-barometer-page/feedback-barometer-page.component';
import { ParticipantContentCarouselPageComponent } from './participant-content-carousel-page/participant-content-carousel-page.component';

const routes: Routes = [
  {
    path: '',
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
    component: ParticipantContentCarouselPageComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.PARTICIPANT] }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ParticipantRoutingModule { }
