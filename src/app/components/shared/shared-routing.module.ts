import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { QuestionWallComponent } from './questionwall/question-wall/question-wall.component';
import { UserRole } from '../../models/user-roles.enum';
import { TagCloudComponent } from './tag-cloud/tag-cloud.component';
import { AuthenticationGuard } from '../../guards/authentication.guard';
import { GPTChatRoomComponent } from './gptchat-room/gptchat-room.component';
import { ComponentTestPageComponent } from './component-test/component-test-page/component-test-page.component';

const routes: Routes = [
  {
    path: 'component-test-page',
    component: ComponentTestPageComponent,
  },
  {
    path: 'room/:shortId/comments/questionwall',
    component: QuestionWallComponent,
    data: {
      roles: [
        UserRole.CREATOR,
        UserRole.EDITING_MODERATOR,
        UserRole.EXECUTIVE_MODERATOR,
        UserRole.PARTICIPANT,
      ],
    },
    canActivate: [AuthenticationGuard],
    title: 'questionwall',
  },
  {
    path: 'room/:shortId/comments/tagcloud',
    component: TagCloudComponent,
    data: {
      roles: [
        UserRole.CREATOR,
        UserRole.EDITING_MODERATOR,
        UserRole.EXECUTIVE_MODERATOR,
        UserRole.PARTICIPANT,
      ],
    },
    canActivate: [AuthenticationGuard],
    title: 'tagcloud',
  },
  {
    path: 'room/:shortId/comments/brainstorming',
    component: TagCloudComponent,
    data: {
      roles: [
        UserRole.CREATOR,
        UserRole.EDITING_MODERATOR,
        UserRole.EXECUTIVE_MODERATOR,
        UserRole.PARTICIPANT,
      ],
      brainstorming: true,
    },
    canActivate: [AuthenticationGuard],
    title: 'brainstorming',
  },
  {
    path: 'room/:shortId/gpt-chat-room',
    component: GPTChatRoomComponent,
    data: {
      roles: [
        UserRole.CREATOR,
        UserRole.EDITING_MODERATOR,
        UserRole.EXECUTIVE_MODERATOR,
        UserRole.PARTICIPANT,
      ],
    },
    canActivate: [AuthenticationGuard],
    title: 'gpt-chat-room',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SharedRoutingModule {}
