import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthenticationGuard } from '../../guards/authentication.guard';
import { UserRole } from '../../models/user-roles.enum';
import { RoomCreatorPageComponent } from './room-creator-page/room-creator-page.component';
import { CommentPageComponent } from '../shared/comment-page/comment-page.component';
import { CommentAnswerComponent } from '../shared/comment-answer/comment-answer.component';
import { QuestionWallComponent } from '../shared/questionwall/question-wall/question-wall.component';

const routes: Routes = [
  {
    path: 'room/:shortId',
    component: RoomCreatorPageComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.CREATOR] }
  },
  {
    path: 'room/:shortId/comments',
    component: CommentPageComponent,
    canActivate: [AuthenticationGuard],
    data: { roles: [UserRole.CREATOR] }
  },
  {
    path: 'room/:shortId/comment/:commentId',
    component: CommentAnswerComponent,
    canActivate: [AuthenticationGuard],
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class CreatorRoutingModule {
}
