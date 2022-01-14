import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommentListComponent } from './comment-list/comment-list.component';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { RoomListComponent } from './room-list/room-list.component';
import { RoomPageComponent } from './room-page/room-page.component';
import { CommentPageComponent } from './comment-page/comment-page.component';
import { EssentialsModule } from '../essentials/essentials.module';
import { SharedRoutingModule } from './shared-routing.module';
import { RoomJoinComponent } from './room-join/room-join.component';
import { RoomCreateComponent } from './_dialogs/room-create/room-create.component';
import { UserBonusTokenComponent } from '../participant/_dialogs/user-bonus-token/user-bonus-token.component';
import { RemindOfTokensComponent } from '../participant/_dialogs/remind-of-tokens/remind-of-tokens.component';
import { LoginComponent } from './login/login.component';
import { CommentComponent } from './comment/comment.component';
import { CreateCommentComponent } from './_dialogs/create-comment/create-comment.component';
import { PresentCommentComponent } from './_dialogs/present-comment/present-comment.component';
import { DeleteAccountComponent } from './_dialogs/delete-account/delete-account.component';
import { DialogActionButtonsComponent } from './dialog/dialog-action-buttons/dialog-action-buttons.component';
import { QrCodeDialogComponent } from './_dialogs/qr-code-dialog/qr-code-dialog.component';
import { ArsModule } from '../../../../projects/ars/src/lib/ars.module';
import { RemoveFromHistoryComponent } from './_dialogs/remove-from-history/remove-from-history.component';
import { CommentAnswerComponent } from './comment-answer/comment-answer.component';
import { MarkdownModule } from 'ngx-markdown';
import { MatRippleModule } from '@angular/material/core';
import { QRCodeModule } from 'angularx-qrcode';
import { MotdDialogComponent } from './_dialogs/motd-dialog/motd-dialog.component';
import { MotdMessageComponent } from './_dialogs/motd-dialog/motd-message/motd-message.component';
import { TagCloudModule } from 'angular-tag-cloud-module';
import { CloudConfigurationComponent } from './_dialogs/cloud-configuration/cloud-configuration.component';
import { ColorPickerModule } from 'ngx-color-picker';
import { TopicCloudConfirmDialogComponent } from './_dialogs/topic-cloud-confirm-dialog/topic-cloud-confirm-dialog.component';
import { TopicCloudAdministrationComponent } from './_dialogs/topic-cloud-administration/topic-cloud-administration.component';
import { TopicDialogCommentComponent } from './dialog/topic-dialog-comment/topic-dialog-comment.component';
import { TopicCloudFilterComponent } from './_dialogs/topic-cloud-filter/topic-cloud-filter.component';
import { SpacyDialogComponent } from './_dialogs/spacy-dialog/spacy-dialog.component';
import { TagCloudPopUpComponent } from './tag-cloud/tag-cloud-pop-up/tag-cloud-pop-up.component';
import { WorkerDialogComponent } from './_dialogs/worker-dialog/worker-dialog.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ActiveUserComponent } from './overlay/active-user/active-user.component';
import { AutofocusDirective } from '../../directives/autofocus.directive';
import { JoyrideModule } from 'ngx-joyride';
import { TagCloudComponent } from './tag-cloud/tag-cloud.component';
import { JoyrideTemplateComponent } from './_dialogs/joyride-template/joyride-template.component';
import { JoyrideTemplateDirective } from '../../directives/joyride-template.directive';
import { MatSpinnerOverlayComponent } from './mat-spinner-overlay/mat-spinner-overlay.component';
import { WriteCommentComponent } from './write-comment/write-comment.component';
import { CustomMarkdownComponent } from './custom-markdown/custom-markdown.component';
import { ScrollIntoViewDirective } from '../../directives/scroll-into-view.directive';
import { QuillModule } from 'ngx-quill';
import { ViewCommentDataComponent } from './view-comment-data/view-comment-data.component';
import { DeepLDialogComponent } from './_dialogs/deep-ldialog/deep-ldialog.component';
import { ExplanationDialogComponent } from './_dialogs/explanation-dialog/explanation-dialog.component';
import { QuillInputDialogComponent } from './_dialogs/quill-input-dialog/quill-input-dialog.component';
import { WorkerConfigDialogComponent } from './_dialogs/worker-config-dialog/worker-config-dialog.component';
import { AccessibilityEscapedInputDirective } from '../../directives/accessibility-escaped-input.directive';
import { QuestionWallIntroComponent } from './questionwall/question-wall/question-wall-intro/question-wall-intro/question-wall-intro.component';
import { TopicCloudBrainstormingComponent } from './_dialogs/topic-cloud-brainstorming/topic-cloud-brainstorming.component';
import { IntroductionQuestionWallComponent } from './_dialogs/introductions/introduction-question-wall/introduction-question-wall.component';
import { IntroductionQuestionWallDEComponent } from './_dialogs/introductions/introduction-question-wall/introduction-question-wall-de/introduction-question-wall-de.component';
import { IntroductionQuestionWallENComponent } from './_dialogs/introductions/introduction-question-wall/introduction-question-wall-en/introduction-question-wall-en.component';
import { IntroductionRoomListComponent } from './_dialogs/introductions/introduction-room-list/introduction-room-list.component';
import { IntroductionRoomListDEComponent } from './_dialogs/introductions/introduction-room-list/introduction-room-list-de/introduction-room-list-de.component';
import { IntroductionRoomListENComponent } from './_dialogs/introductions/introduction-room-list/introduction-room-list-en/introduction-room-list-en.component';
import { IntroductionRoomPageComponent } from './_dialogs/introductions/introduction-room-page/introduction-room-page.component';
import { IntroductionRoomPageDEComponent } from './_dialogs/introductions/introduction-room-page/introduction-room-page-de/introduction-room-page-de.component';
import { IntroductionRoomPageENComponent } from './_dialogs/introductions/introduction-room-page/introduction-room-page-en/introduction-room-page-en.component';
import { IntroductionCommentListComponent } from './_dialogs/introductions/introduction-comment-list/introduction-comment-list.component';
import { IntroductionCommentListDEComponent } from './_dialogs/introductions/introduction-comment-list/introduction-comment-list-de/introduction-comment-list-de.component';
import { IntroductionCommentListENComponent } from './_dialogs/introductions/introduction-comment-list/introduction-comment-list-en/introduction-comment-list-en.component';
import { IntroductionTagCloudComponent } from './_dialogs/introductions/introduction-tag-cloud/introduction-tag-cloud.component';
import { IntroductionTagCloudDEComponent } from './_dialogs/introductions/introduction-tag-cloud/introduction-tag-cloud-de/introduction-tag-cloud-de.component';
import { IntroductionTagCloudENComponent } from './_dialogs/introductions/introduction-tag-cloud/introduction-tag-cloud-en/introduction-tag-cloud-en.component';
import { IntroductionBrainstormingComponent } from './_dialogs/introductions/introduction-brainstorming/introduction-brainstorming.component';
import { IntroductionBrainstormingDEComponent } from './_dialogs/introductions/introduction-brainstorming/introduction-brainstorming-de/introduction-brainstorming-de.component';
import { IntroductionBrainstormingENComponent } from './_dialogs/introductions/introduction-brainstorming/introduction-brainstorming-en/introduction-brainstorming-en.component';
import { IntroductionModerationComponent } from './_dialogs/introductions/introduction-moderation/introduction-moderation.component';
import { IntroductionModerationDEComponent } from './_dialogs/introductions/introduction-moderation/introduction-moderation-de/introduction-moderation-de.component';
import { IntroductionModerationENComponent } from './_dialogs/introductions/introduction-moderation/introduction-moderation-en/introduction-moderation-en.component';

@NgModule({
  imports: [
    CommonModule,
    EssentialsModule,
    SharedRoutingModule,
    MatRippleModule,
    ArsModule,
    MarkdownModule,
    QRCodeModule,
    TagCloudModule,
    ColorPickerModule,
    DragDropModule,
    JoyrideModule.forChild(),
    QuillModule
  ],
  declarations: [
    RoomJoinComponent,
    PageNotFoundComponent,
    RoomPageComponent,
    RoomListComponent,
    HeaderComponent,
    FooterComponent,
    CommentPageComponent,
    CommentListComponent,
    RoomCreateComponent,
    UserBonusTokenComponent,
    RemindOfTokensComponent,
    LoginComponent,
    CloudConfigurationComponent,
    CommentComponent,
    CreateCommentComponent,
    PresentCommentComponent,
    DeleteAccountComponent,
    DialogActionButtonsComponent,
    QrCodeDialogComponent,
    RemoveFromHistoryComponent,
    CommentAnswerComponent,
    MotdDialogComponent,
    MotdMessageComponent,
    TopicCloudConfirmDialogComponent,
    TopicCloudAdministrationComponent,
    TopicDialogCommentComponent,
    TopicCloudFilterComponent,
    SpacyDialogComponent,
    TagCloudComponent,
    TagCloudPopUpComponent,
    ActiveUserComponent,
    WorkerDialogComponent,
    AutofocusDirective,
    JoyrideTemplateComponent,
    JoyrideTemplateDirective,
    MatSpinnerOverlayComponent,
    WriteCommentComponent,
    CustomMarkdownComponent,
    ScrollIntoViewDirective,
    ViewCommentDataComponent,
    DeepLDialogComponent,
    ExplanationDialogComponent,
    QuillInputDialogComponent,
    WorkerConfigDialogComponent,
    AccessibilityEscapedInputDirective,
    QuestionWallIntroComponent,
    TopicCloudBrainstormingComponent,
    IntroductionQuestionWallComponent,
    IntroductionQuestionWallDEComponent,
    IntroductionQuestionWallENComponent,
    IntroductionRoomListComponent,
    IntroductionRoomListDEComponent,
    IntroductionRoomListENComponent,
    IntroductionRoomPageComponent,
    IntroductionRoomPageDEComponent,
    IntroductionRoomPageENComponent,
    IntroductionCommentListComponent,
    IntroductionCommentListDEComponent,
    IntroductionCommentListENComponent,
    IntroductionTagCloudComponent,
    IntroductionTagCloudDEComponent,
    IntroductionTagCloudENComponent,
    IntroductionBrainstormingComponent,
    IntroductionBrainstormingDEComponent,
    IntroductionBrainstormingENComponent,
    IntroductionModerationComponent,
    IntroductionModerationDEComponent,
    IntroductionModerationENComponent
  ],
    exports:[
        RoomJoinComponent,
        PageNotFoundComponent,
        RoomPageComponent,
        RoomListComponent,
        HeaderComponent,
        FooterComponent,
        CommentPageComponent,
        CommentListComponent,
        CreateCommentComponent,
        PresentCommentComponent,
        CommentComponent,
        DialogActionButtonsComponent,
        UserBonusTokenComponent,
        CloudConfigurationComponent,
        TagCloudPopUpComponent,
        ActiveUserComponent,
        MatSpinnerOverlayComponent,
        JoyrideTemplateDirective,
        AutofocusDirective,
        CustomMarkdownComponent,
        ScrollIntoViewDirective,
        ViewCommentDataComponent,
        WriteCommentComponent,
        AccessibilityEscapedInputDirective,
        QuestionWallIntroComponent
    ]
})
export class SharedModule {
}
