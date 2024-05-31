import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { QuestionWallComponent } from './questionwall/question-wall/question-wall.component';
import { UserRole } from '../../models/user-roles.enum';
import { TagCloudComponent } from '../../room/tag-cloud/tag-cloud.component';
import { AuthenticationGuard } from '../../guards/authentication.guard';
import { GPTChatRoomComponent } from '../../room/gptchat-room/gptchat-room.component';
import { ComponentTestPageComponent } from './component-test/component-test-page/component-test-page.component';
import { ComponentLayoutTestPageComponent } from './component-test/component-layout-test-page/component-layout-test-page.component';
import { ComponentTypographyTestPageComponent } from './component-test/component-typography-test-page/component-typography-test-page.component';

const routes: Routes = [
  {
    path: 'component-test-page',
    component: ComponentTestPageComponent,
  },
  {
    path: 'component-typography-test-page',
    component: ComponentTypographyTestPageComponent,
  },
  {
    path: 'component-layout-test-page',
    component: ComponentLayoutTestPageComponent,
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
