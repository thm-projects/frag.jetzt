import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreatorRoutingModule } from './creator-routing.module';
import { AnswersListComponent } from './answers-list/answers-list.component';
import { CommentCreatePageComponent } from './comment-create-page/comment-create-page.component';
import { ContentChoiceCreatorComponent } from './content-choice-creator/content-choice-creator.component';
import { ContentCreatePageComponent } from './content-create-page/content-create-page.component';
import { ContentLikertCreatorComponent } from './content-likert-creator/content-likert-creator.component';
import { ContentTextCreatorComponent } from './content-text-creator/content-text-creator.component';
import { ContentYesNoCreatorComponent } from './content-yes-no-creator/content-yes-no-creator.component';
import { HomeCreatorPageComponent } from './home-creator-page/home-creator-page.component';
import { MarkdownToolbarComponent } from './markdown-toolbar/markdown-toolbar.component';
import { RoomCreatorPageComponent } from './room-creator-page/room-creator-page.component';
import { StatisticsComponent } from '../shared/statistics/statistics.component';
import { CommentListComponent } from '../shared/comment-list/comment-list.component';

@NgModule({
  imports: [
    CommonModule,
    CreatorRoutingModule
  ],
  declarations: [
    AnswersListComponent,
    CommentCreatePageComponent,
    ContentChoiceCreatorComponent,
    ContentCreatePageComponent,
    ContentLikertCreatorComponent,
    ContentTextCreatorComponent,
    ContentYesNoCreatorComponent,
    HomeCreatorPageComponent,
    MarkdownToolbarComponent,
    RoomCreatorPageComponent,
    StatisticsComponent,
    CommentListComponent
  ]
})
export class CreatorModule {
}
