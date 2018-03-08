import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { LoginScreenComponent } from './login-screen/login-screen.component';
import { RoomComponent } from './room/room.component';
import { CreatorHomeScreenComponent } from './creator-home-screen/creator-home-screen.component';
import { CreateCommentComponent } from './create-comment/create-comment.component';
import { ParticipantHomeScreenComponent } from './participant-home-screen/participant-home-screen.component';
import { AuthenticationGuard } from './authentication.guard';
import { UserRole } from './user-roles.enum';
import { ParticipantRoomComponent } from './participant-room/participant-room.component';
import { CommentComponent } from './comment/comment.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: LoginScreenComponent },
  {
    path: 'creator',
    component: CreatorHomeScreenComponent,
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
    path: 'room/:roomId',
    component: RoomComponent,
    canActivate: [AuthenticationGuard]
  },
  {
    path: 'room/:roomId/comments',
    component: CommentComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.CREATOR] }
  },
  { path: 'room/:roomId/create-comment',
    component: CreateCommentComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.PARTICIPANT] }
  },
  {
    path: 'participant/room/:roomId',
    component: ParticipantRoomComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.PARTICIPANT] }
  },
  { path: '**', component: PageNotFoundComponent }
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
