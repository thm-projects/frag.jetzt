import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommentListComponent } from './comment-list/comment-list.component';
import { ContentGroupsComponent } from './content-groups/content-groups.component';
import { FeedbackBarometerPageComponent } from './feedback-barometer-page/feedback-barometer-page.component';
import { FooterComponent } from './footer/footer.component';
import { FooterImprintComponent } from './footer-imprint/footer-imprint.component';
import { HeaderComponent } from './header/header.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { RoomJoinComponent } from './room-join/room-join.component';
import { RoomListComponent } from './room-list/room-list.component';
import { RoomPageComponent } from './room-page/room-page.component';
import { StatisticsPageComponent } from './statistics-page/statistics-page.component';
import { AnswerEditComponent } from '../creator/_dialogs/answer-edit/answer-edit.component';
import { ContentDeleteComponent } from '../creator/_dialogs/content-delete/content-delete.component';
import { MarkdownHelpDialogComponent } from '../creator/_dialogs/markdown-help-dialog/markdown-help-dialog.component';
import { GenericDataDialogComponent } from './_dialogs/generic-data-dialog/generic-data-dialog.component';
import { CommentCreatePageComponent } from '../participant/comment-create-page/comment-create-page.component';
import { EssentialsModule } from '../essentials/essentials.module';
import { SharedRoutingModule } from './shared-routing.module';
import { ListStatisticComponent } from './list-statistic/list-statistic.component';
import { ChartsModule } from 'ng2-charts';
import { StatisticComponent } from './statistic/statistic.component';

@NgModule({
  imports: [
    CommonModule,
    EssentialsModule,
    ChartsModule,
    SharedRoutingModule
  ],
  declarations: [
    RoomJoinComponent,
    PageNotFoundComponent,
    RoomPageComponent,
    RoomListComponent,
    ContentGroupsComponent,
    HeaderComponent,
    AnswerEditComponent,
    ContentDeleteComponent,
    FeedbackBarometerPageComponent,
    MarkdownHelpDialogComponent,
    GenericDataDialogComponent,
    FooterComponent,
    FooterImprintComponent,
    FeedbackBarometerPageComponent,
    CommentCreatePageComponent,
    CommentListComponent,
    StatisticsPageComponent,
    ListStatisticComponent,
    StatisticComponent
  ],
  exports: [
    RoomJoinComponent,
    PageNotFoundComponent,
    RoomPageComponent,
    RoomListComponent,
    ContentGroupsComponent,
    HeaderComponent,
    AnswerEditComponent,
    ContentDeleteComponent,
    FeedbackBarometerPageComponent,
    MarkdownHelpDialogComponent,
    GenericDataDialogComponent,
    FooterComponent,
    FooterImprintComponent,
    FeedbackBarometerPageComponent,
    CommentCreatePageComponent,
    CommentListComponent,
    StatisticsPageComponent
  ],
  entryComponents: [
    MarkdownHelpDialogComponent,
    GenericDataDialogComponent
  ]
})
export class SharedModule {
}
