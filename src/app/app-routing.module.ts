import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PageNotFoundComponent } from './components/pages/page-not-found/page-not-found.component';
import { LoginComponent } from './components/pages/login/login.component';
import { HomeCreatorComponent } from './components/pages/home-creator/home-creator.component';
import { CommentCreateComponent } from './components/pages/comment-create/comment-create.component';
import { HomeParticipantComponent } from './components/pages/home-participant/home-participant.component';
import { AuthenticationGuard } from './guards/authentication.guard';
import { UserRole } from './models/user-roles.enum';
import { RoomParticipantComponent } from './components/pages/room-participant/room-participant.component';
import { RoomCreatorComponent } from './components/pages/room-creator/room-creator.component';
import { CommentListComponent } from './components/fragments/comment-list/comment-list.component';
import { ContentListComponent } from './components/fragments/content-list/content-list.component';
import { StatisticsComponent } from './components/fragments/statistics/statistics.component';
import { ContentCreateComponent } from './components/pages/content-create/content-create.component';
import {
  ContentCarouselComponent
} from './components/pages/content-carousel/content-carousel.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: LoginComponent
  },
  {
    path: 'creator',
    component: HomeCreatorComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.CREATOR] }
  },
  {
    path: 'creator/room/:roomId',
    component: RoomCreatorComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.CREATOR] }
  },
  {
    path: 'creator/room/:roomId/content-create',
    component: ContentCreateComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.CREATOR] }
  },
  {
    path: 'creator/room/:roomId/statistics',
    component: StatisticsComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.CREATOR] }
  },
  {
    path: 'creator/room/:roomId/comments',
    component: CommentListComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.CREATOR] }
  },
  {
    path: 'creator/room/:roomId/content',
    component: ContentListComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.CREATOR] }
  },
  {
    path: 'participant',
    component: HomeParticipantComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.PARTICIPANT] }
  },
  {
    path: 'participant/room/:roomId',
    component: RoomParticipantComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.PARTICIPANT] }
  },
  {
    path: 'participant/room/:roomId/comment-create',
    component: CommentCreateComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.PARTICIPANT] }
  },
  {
    path: 'participant/room/:roomId/questions',
    component: ContentCarouselComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.PARTICIPANT] }
  },
  {
    path: '**',
    component: PageNotFoundComponent
  }
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
