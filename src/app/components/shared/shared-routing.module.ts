import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { QuestionWallComponent } from './questionwall/question-wall/question-wall.component';
import { UserRole } from '../../models/user-roles.enum';
import { TagCloudComponent } from './tag-cloud/tag-cloud.component';
import { AuthenticationGuard } from '../../guards/authentication.guard';
import { GptChatComponent } from './gpt-chat/gpt-chat.component';

const routes: Routes = [
  {
    path: 'room/:shortId/comments/questionwall',
    component: QuestionWallComponent,
    data: {
      roles: [
        UserRole.CREATOR,
        UserRole.EDITING_MODERATOR,
        UserRole.EXECUTIVE_MODERATOR,
        UserRole.PARTICIPANT
      ]
    },
    canActivate: [AuthenticationGuard],
  },
  {
    path: 'room/:shortId/comments/tagcloud',
    component: TagCloudComponent,
    data: {
      roles: [
        UserRole.CREATOR,
        UserRole.EDITING_MODERATOR,
        UserRole.EXECUTIVE_MODERATOR,
        UserRole.PARTICIPANT
      ]
    },
    canActivate: [AuthenticationGuard],
  },
  {
    path: 'room/:shortId/comments/brainstorming',
    component: TagCloudComponent,
    data: {
      roles: [
        UserRole.CREATOR,
        UserRole.EDITING_MODERATOR,
        UserRole.EXECUTIVE_MODERATOR,
        UserRole.PARTICIPANT
      ],
      brainstorming: true
    },
    canActivate: [AuthenticationGuard],
  },
  {
    path: 'room/:shortId/gpt-chat',
    component: GptChatComponent,
    data: {
      roles: [
        UserRole.CREATOR,
        UserRole.EDITING_MODERATOR,
        UserRole.EXECUTIVE_MODERATOR,
        UserRole.PARTICIPANT
      ],
    },
    canActivate: [AuthenticationGuard],
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class SharedRoutingModule {
}
