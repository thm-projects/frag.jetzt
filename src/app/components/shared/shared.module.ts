import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommentListComponent } from './comment-list/comment-list.component';
import { ContentGroupsComponent } from './content-groups/content-groups.component';
import { FeedbackBarometerPageComponent } from './feedback-barometer-page/feedback-barometer-page.component';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { RoomListComponent } from './room-list/room-list.component';
import { RoomPageComponent } from './room-page/room-page.component';
import { StatisticsPageComponent } from './statistics-page/statistics-page.component';
import { AnswerEditComponent } from '../creator/_dialogs/answer-edit/answer-edit.component';
import { ContentDeleteComponent } from '../creator/_dialogs/content-delete/content-delete.component';
import { CommentPageComponent } from './comment-page/comment-page.component';
import { EssentialsModule } from '../essentials/essentials.module';
import { SharedRoutingModule } from './shared-routing.module';
import { ListStatisticComponent } from './list-statistic/list-statistic.component';
import { ChartsModule } from 'ng2-charts';
import { StatisticComponent } from './statistic/statistic.component';
import { RoomJoinComponent } from './room-join/room-join.component';
import { RoomCreateComponent } from './_dialogs/room-create/room-create.component';
import { UserBonusTokenComponent } from './_dialogs/user-bonus-token/user-bonus-token.component';
import { LoginComponent } from './login/login.component';
import { StatisticHelpComponent } from './_dialogs/statistic-help/statistic-help.component';
import { CommentComponent } from './comment/comment.component';
import { CreateCommentComponent } from './_dialogs/create-comment/create-comment.component';
import { PresentCommentComponent } from './_dialogs/present-comment/present-comment.component';
import { DeleteAccountComponent } from './_dialogs/delete-account/delete-account.component';
import { CommentAnswerTextComponent } from './_dialogs/comment-answer-text/comment-answer-text.component';
import { DialogActionButtonsComponent } from './dialog/dialog-action-buttons/dialog-action-buttons.component';
import { MatRippleModule } from '@angular/material';
import { QrCodeDialogComponent } from './_dialogs/qr-code-dialog/qr-code-dialog.component';
import { NgxQRCodeModule } from 'ngx-qrcode2';
import { ArsModule } from '../../../../projects/ars/src/lib/ars.module';

@NgModule({
  imports: [
    CommonModule,
    EssentialsModule,
    ChartsModule,
    SharedRoutingModule,
    MatRippleModule,
    NgxQRCodeModule,
    ArsModule
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
    FooterComponent,
    FeedbackBarometerPageComponent,
    CommentPageComponent,
    CommentListComponent,
    StatisticsPageComponent,
    ListStatisticComponent,
    StatisticComponent,
    RoomCreateComponent,
    UserBonusTokenComponent,
    LoginComponent,
    StatisticHelpComponent,
    CommentComponent,
    CreateCommentComponent,
    PresentCommentComponent,
    DeleteAccountComponent,
    CommentAnswerTextComponent,
    DialogActionButtonsComponent,
    QrCodeDialogComponent
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
    FooterComponent,
    FeedbackBarometerPageComponent,
    CommentPageComponent,
    CommentListComponent,
    StatisticsPageComponent,
    CreateCommentComponent,
    PresentCommentComponent,
    CommentComponent,
    DialogActionButtonsComponent,
    UserBonusTokenComponent
  ],
  entryComponents: [
    RoomCreateComponent,
    LoginComponent,
    StatisticHelpComponent,
    CreateCommentComponent,
    PresentCommentComponent,
    DeleteAccountComponent,
    UserBonusTokenComponent,
    CommentAnswerTextComponent
  ]
})
export class SharedModule {
}
