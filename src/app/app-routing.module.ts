import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { LoginScreenComponent } from './login-screen/login-screen.component';
import { CreatorHomeScreenComponent } from './creator-home-screen/creator-home-screen.component';
import { CreateCommentComponent } from './create-comment/create-comment.component';
import { ParticipantHomeScreenComponent } from './participant-home-screen/participant-home-screen.component';
import { AuthenticationGuard } from './authentication.guard';
import { UserRole } from './user-roles.enum';
import { ParticipantRoomComponent } from './participant-room/participant-room.component';
import { CreatorRoomComponent } from './creator-room/creator-room.component';
import { CommentListComponent } from './comment-list/comment-list.component';
import { ContentListComponent } from './content-list/content-list.component';
import { ContentCreationComponent } from './content-creation/content-creation.component';
import { ContentDetailComponent } from './content-detail/content-detail.component';

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
    path: 'creator/room/:roomId',
    component: CreatorRoomComponent,
    canActivate: [AuthenticationGuard]
  },
  {
    path: 'creator/room/:roomId',
    component: CreatorRoomComponent,
    canActivate: [AuthenticationGuard]
  },
  {
    path: 'creator/room/:roomId/comments',
    component: CommentListComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.CREATOR] }
  },
  {
    path: 'creator/room/:roomId/content-creation',
    component: ContentCreationComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.CREATOR] }
  },
  {
    path: 'creator/room/:roomId/content-list',
    component: ContentListComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.CREATOR] }
  },
  {
    path: 'creator/room/:roomId/content-list/:id',
    component: ContentDetailComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.CREATOR] }
  },
  { path: 'participant/room/:roomId/create-comment',
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
