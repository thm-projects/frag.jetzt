import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { QuestionWallComponent } from './questionwall/question-wall/question-wall.component';
import { AuthenticationGuard } from '../../guards/authentication.guard';
import { UserRole } from '../../models/user-roles.enum';
import { TagCloudComponent } from './tag-cloud/tag-cloud.component';
import { QuizNowComponent } from './quiz-now/quiz-now.component';

const routes: Routes = [
  {
    path: 'room/:shortId/comments/questionwall',
    component: QuestionWallComponent,
    data: { roles: [
        UserRole.CREATOR,
        UserRole.EDITING_MODERATOR,
        UserRole.EXECUTIVE_MODERATOR,
        UserRole.PARTICIPANT] }
  },

  {
    path: 'room/:shortId/comments/quiznow',
    component: QuizNowComponent,
    data: { roles: [
        UserRole.CREATOR,
        UserRole.EDITING_MODERATOR,
        UserRole.EXECUTIVE_MODERATOR,
        UserRole.PARTICIPANT] }
  },

  {
    path: 'room/:shortId/comments/tagcloud',
    component: TagCloudComponent,
    data: { roles: [
        UserRole.CREATOR,
        UserRole.EDITING_MODERATOR,
        UserRole.EXECUTIVE_MODERATOR,
        UserRole.PARTICIPANT] }
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class SharedRoutingModule {
}
