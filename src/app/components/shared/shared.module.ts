import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommentListComponent } from './comment-list/comment-list.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { RoomListComponent } from './room-list/room-list.component';
import { CommentPageComponent } from './comment-page/comment-page.component';
import { EssentialsModule } from '../essentials/essentials.module';
import { SharedRoutingModule } from './shared-routing.module';
import { RoomJoinComponent } from './room-join/room-join.component';
import { UserBonusTokenComponent } from '../participant/_dialogs/user-bonus-token/user-bonus-token.component';
import { RemindOfTokensComponent } from '../participant/_dialogs/remind-of-tokens/remind-of-tokens.component';
import { LoginComponent } from './login/login.component';
import { CreateCommentComponent } from './_dialogs/create-comment/create-comment.component';
import { DialogActionButtonsComponent } from './dialog/dialog-action-buttons/dialog-action-buttons.component';
import { QrCodeDialogComponent } from './_dialogs/qr-code-dialog/qr-code-dialog.component';
import { ArsModule } from '../../../../projects/ars/src/lib/ars.module';
import { CommentAnswerComponent } from './comment-answer/comment-answer.component';
import { MatRippleModule } from '@angular/material/core';
import { QRCodeComponent } from 'angularx-qrcode';
import { MotdDialogComponent } from './_dialogs/motd-dialog/motd-dialog.component';
import { MotdMessageComponent } from './_dialogs/motd-dialog/motd-message/motd-message.component';
import { CloudConfigurationComponent } from './_dialogs/cloud-configuration/cloud-configuration.component';
import { ColorPickerModule } from 'ngx-color-picker';
import { TopicCloudConfirmDialogComponent } from './_dialogs/topic-cloud-confirm-dialog/topic-cloud-confirm-dialog.component';
import { TopicCloudAdministrationComponent } from './_dialogs/topic-cloud-administration/topic-cloud-administration.component';
import { TopicDialogCommentComponent } from './dialog/topic-dialog-comment/topic-dialog-comment.component';
import { TopicCloudFilterComponent } from '../../room/tag-cloud/dialogs/topic-cloud-filter/topic-cloud-filter.component';
import { SpacyDialogComponent } from './_dialogs/spacy-dialog/spacy-dialog.component';
import { TagCloudPopUpComponent } from '../../room/tag-cloud/tag-cloud-pop-up/tag-cloud-pop-up.component';
import { WorkerDialogComponent } from './_dialogs/worker-dialog/worker-dialog.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ActiveUserComponent } from './overlay/active-user/active-user.component';
import { AutofocusDirective } from '../../directives/autofocus.directive';
import { JoyrideModule } from 'ngx-joyride';
import { TagCloudComponent } from '../../room/tag-cloud/tag-cloud.component';
import { JoyrideTemplateComponent } from './_dialogs/joyride-template/joyride-template.component';
import { JoyrideTemplateDirective } from '../../directives/joyride-template.directive';
import { MatSpinnerOverlayComponent } from './mat-spinner-overlay/mat-spinner-overlay.component';
import { WriteCommentComponent } from './write-comment/write-comment.component';
import { ScrollIntoViewDirective } from '../../directives/scroll-into-view.directive';
import { DeepLDialogComponent } from './_dialogs/deep-ldialog/deep-ldialog.component';
import { ExplanationDialogComponent } from './_dialogs/explanation-dialog/explanation-dialog.component';
import { WorkerConfigDialogComponent } from './_dialogs/worker-config-dialog/worker-config-dialog.component';
import { WordCloudComponent } from '../../room/tag-cloud/word-cloud/word-cloud.component';
import { AccessibilityEscapedInputDirective } from '../../directives/accessibility-escaped-input.directive';
import { TopicCloudBrainstormingComponent } from '../../room/tag-cloud/dialogs/topic-cloud-brainstorming/topic-cloud-brainstorming.component';
import { IntroductionQuestionWallComponent } from './_dialogs/introductions/introduction-question-wall/introduction-question-wall.component';
import { IntroductionQuestionWallDEComponent } from '../../../assets/i18n/components/_dialogs/introductions/introduction-question-wall/introduction-question-wall-de.component';
import { IntroductionQuestionWallENComponent } from '../../../assets/i18n/components/_dialogs/introductions/introduction-question-wall/introduction-question-wall-en.component';
import { IntroductionRoomListComponent } from './_dialogs/introductions/introduction-room-list/introduction-room-list.component';
import { IntroductionRoomListDEComponent } from '../../../assets/i18n/components/_dialogs/introductions/introduction-room-list/introduction-room-list-de.component';
import { IntroductionRoomListENComponent } from '../../../assets/i18n/components/_dialogs/introductions/introduction-room-list/introduction-room-list-en.component';
import { IntroductionRoomPageComponent } from './_dialogs/introductions/introduction-room-page/introduction-room-page.component';
import { IntroductionRoomPageDEComponent } from '../../../assets/i18n/components/_dialogs/introductions/introduction-room-page/introduction-room-page-de.component';
import { IntroductionRoomPageENComponent } from '../../../assets/i18n/components/_dialogs/introductions/introduction-room-page/introduction-room-page-en.component';
import { IntroductionCommentListComponent } from './_dialogs/introductions/introduction-comment-list/introduction-comment-list.component';
import { IntroductionCommentListDEComponent } from '../../../assets/i18n/components/_dialogs/introductions/introduction-comment-list/introduction-comment-list-de.component';
import { IntroductionCommentListENComponent } from '../../../assets/i18n/components/_dialogs/introductions/introduction-comment-list/introduction-comment-list-en.component';
import { IntroductionTagCloudComponent } from './_dialogs/introductions/introduction-tag-cloud/introduction-tag-cloud.component';
import { IntroductionTagCloudDEComponent } from '../../../assets/i18n/components/_dialogs/introductions/introduction-tag-cloud/introduction-tag-cloud-de.component';
import { IntroductionTagCloudENComponent } from '../../../assets/i18n/components/_dialogs/introductions/introduction-tag-cloud/introduction-tag-cloud-en.component';
import { IntroductionBrainstormingComponent } from './_dialogs/introductions/introduction-brainstorming/introduction-brainstorming.component';
import { IntroductionBrainstormingDEComponent } from '../../../assets/i18n/components/_dialogs/introductions/introduction-brainstorming/introduction-brainstorming-de.component';
import { IntroductionBrainstormingENComponent } from '../../../assets/i18n/components/_dialogs/introductions/introduction-brainstorming/introduction-brainstorming-en.component';
import { IntroductionModerationComponent } from './_dialogs/introductions/introduction-moderation/introduction-moderation.component';
import { IntroductionModerationDEComponent } from '../../../assets/i18n/components/_dialogs/introductions/introduction-moderation/introduction-moderation-de.component';
import { IntroductionModerationENComponent } from '../../../assets/i18n/components/_dialogs/introductions/introduction-moderation/introduction-moderation-en.component';
import { CommentNotificationDialogComponent } from './_dialogs/comment-notification-dialog/comment-notification-dialog.component';
import { ToggleConversationComponent } from '../creator/_dialogs/toggle-conversation/toggle-conversation.component';
import { DashboardComponent } from './_dialogs/dashboard/dashboard.component';
import { DashboardDialogComponent } from './_dialogs/dashboard-dialog/dashboard-dialog.component';
import { DeleteAllNotificationsComponent } from './_dialogs/delete-all-notifications/delete-all-notifications.component';
import { RoomSettingsOverviewComponent } from './_dialogs/room-settings-overview/room-settings-overview.component';
import { AppRatingComponent } from './app-rating/app-rating.component';
import { AppRatingPopUpComponent } from './_dialogs/app-rating-pop-up/app-rating-pop-up.component';
import { MinuteJumpClockComponent } from './minute-jump-clock/minute-jump-clock.component';
import { IntroductionBrainstormingFRComponent } from '../../../assets/i18n/components/_dialogs/introductions/introduction-brainstorming/introduction-brainstorming-fr.component';
import { IntroductionCommentListFRComponent } from '../../../assets/i18n/components/_dialogs/introductions/introduction-comment-list/introduction-comment-list-fr.component';
import { IntroductionModerationFRComponent } from '../../../assets/i18n/components/_dialogs/introductions/introduction-moderation/introduction-moderation-fr.component';
import { IntroductionQuestionWallFRComponent } from '../../../assets/i18n/components/_dialogs/introductions/introduction-question-wall/introduction-question-wall-fr.component';
import { IntroductionRoomListFRComponent } from '../../../assets/i18n/components/_dialogs/introductions/introduction-room-list/introduction-room-list-fr.component';
import { IntroductionRoomPageFRComponent } from '../../../assets/i18n/components/_dialogs/introductions/introduction-room-page/introduction-room-page-fr.component';
import { IntroductionTagCloudFRComponent } from '../../../assets/i18n/components/_dialogs/introductions/introduction-tag-cloud/introduction-tag-cloud-fr.component';
import { TranslateService } from '@ngx-translate/core';
import { PseudonymEditorComponent } from './_dialogs/pseudonym-editor/pseudonym-editor.component';
import { BrainstormingBlacklistEditComponent } from './_dialogs/brainstorming-blacklist-edit/brainstorming-blacklist-edit.component';
import { EditQuestionComponent } from './_dialogs/edit-question/edit-question.component';
import { BrainstormingCategoryEditorComponent } from './_dialogs/brainstorming-category-editor/brainstorming-category-editor.component';
import { BrainstormingEditComponent } from './_dialogs/brainstorming-edit/brainstorming-edit.component';
import { BrainstormingDeleteConfirmComponent } from './_dialogs/brainstorming-delete-confirm/brainstorming-delete-confirm.component';
import { FullscreenImageDialogComponent } from './_dialogs/fullscreen-image-dialog/fullscreen-image-dialog.component';
import { NavigationComponent } from './navigation/navigation.component';
import { QuestionWallComponent } from './questionwall/question-wall/question-wall.component';
import { LivepollCreateComponent } from './_dialogs/livepoll/livepoll-create/livepoll-create.component';
import { GptOptInPrivacyComponent } from './_dialogs/gpt-optin-privacy/gpt-optin-privacy.component';
import { GptPrivacyPolicyDeComponent } from '../../../assets/i18n/components/gpt-privacy-policy/gpt-privacy-policy-de';
import { GptPrivacyPolicyEnComponent } from '../../../assets/i18n/components/gpt-privacy-policy/gpt-privacy-policy-en';
import { GptPrivacyPolicyFrComponent } from '../../../assets/i18n/components/gpt-privacy-policy/gpt-privacy-policy-fr';
import { IntroductionPromptGuideChatbotComponent } from './_dialogs/introductions/introduction-prompt-guide-chatbot/introduction-prompt-guide-chatbot.component';
import { IntroductionPromptGuideChatbotDeComponent } from '../../../assets/i18n/components/_dialogs/introductions/introduction-prompt-guide-chatbot/introduction-prompt-guide-chatbot-de.component';
import { IntroductionPromptGuideChatbotEnComponent } from '../../../assets/i18n/components/_dialogs/introductions/introduction-prompt-guide-chatbot/introduction-prompt-guide-chatbot-en.component';
import { IntroductionPromptGuideChatbotFrComponent } from '../../../assets/i18n/components/_dialogs/introductions/introduction-prompt-guide-chatbot/introduction-prompt-guide-chatbot-fr.component';
import { LivepollDialogComponent } from './_dialogs/livepoll/livepoll-dialog/livepoll-dialog.component';
import { LivepollSettingsComponent } from './_dialogs/livepoll/livepoll-settings/livepoll-settings.component';
import { GPTChatRoomComponent } from '../../room/gptchat-room/gptchat-room.component';
import { PresetsDialogComponent } from './_dialogs/presets-dialog/presets-dialog.component';
import { GPTChatInfoComponent } from './_dialogs/gptchat-info/gptchat-info.component';
import { LivepollConfirmationDialogComponent } from './_dialogs/livepoll/livepoll-confirmation-dialog/livepoll-confirmation-dialog.component';
import { LivepollStatisticComponent } from './_dialogs/livepoll/livepoll-statistic/livepoll-statistic.component';
import { LivepollSummaryComponent } from './_dialogs/livepoll/livepoll-summary/livepoll-summary.component';
import { MarkdownEditorComponent } from './utility/markdown/markdown-editor/markdown-editor.component';
import { MarkdownEditorDialogComponent } from './utility/markdown/markdown-editor-dialog/markdown-editor-dialog.component';
import { GPTPresetTopicsDialogComponent } from './_dialogs/gptpreset-topics-dialog/gptpreset-topics-dialog.component';
import { GlobalStatusIndicatorComponent } from './global-status-indicator/global-status-indicator.component';
import { StatusInfoComponent } from './_dialogs/status-info/status-info.component';
import { GptPromptExplanationComponent } from './_dialogs/gpt-prompt-explanation/gpt-prompt-explanation.component';
import { GptPromptExplanationDeComponent } from '../../../assets/i18n/components/gpt-prompt-explanation/gpt-prompt-explanation-de';
import { GptPromptExplanationEnComponent } from '../../../assets/i18n/components/gpt-prompt-explanation/gpt-prompt-explanation-en';
import { GptPromptExplanationFrComponent } from '../../../assets/i18n/components/gpt-prompt-explanation/gpt-prompt-explanation-fr';
import { GPTRatingDialogComponent } from './_dialogs/gptrating-dialog/gptrating-dialog.component';
import { UtilityStyleTestComponent } from './utility/style/utility-style-test/utility-style-test.component';
import { ChatGPTBrainstormComponent } from './_dialogs/chat-gptbrainstorm/chat-gptbrainstorm.component';
import { GPTConversationOverviewComponent } from './_dialogs/gptconversation-overview/gptconversation-overview.component';
import { LivepollPeerInstructionWindowComponent } from './_dialogs/livepoll/livepoll-peer-instruction/livepoll-peer-instruction-window/livepoll-peer-instruction-window.component';
import { LivepollPeerInstructionComparisonComponent } from './_dialogs/livepoll/livepoll-peer-instruction/livepoll-peer-instruction-comparison/livepoll-peer-instruction-comparison.component';
import { AppStateService } from 'app/services/state/app-state.service';
import { MultiLevelDialogComponent } from './_dialogs/multi-level-dialog/multi-level-dialog.component';
import { MultiLevelTextInputComponent } from './_dialogs/multi-level-dialog/multi-level-text-input/multi-level-text-input.component';
import { MultiLevelRadioSelectComponent } from './_dialogs/multi-level-dialog/multi-level-radio-select/multi-level-radio-select.component';
import { MultiLevelSwitchComponent } from './_dialogs/multi-level-dialog/multi-level-switch/multi-level-switch.component';
import { MultiLevelTextComponent } from './_dialogs/multi-level-dialog/multi-level-text/multi-level-text.component';
import { HelpRoomCreateComponent } from './_dialogs/room-create/help-room-create/help-room-create.component';
import { HelpRoomCreateDeComponent } from './_dialogs/room-create/help-room-create/help-room-create-de/help-room-create-de.component';
import { HelpRoomCreateEnComponent } from './_dialogs/room-create/help-room-create/help-room-create-en/help-room-create-en.component';
import { HelpRoomCreateFrComponent } from './_dialogs/room-create/help-room-create/help-room-create-fr/help-room-create-fr.component';
import { MultiLevelQuotaInputComponent } from './_dialogs/multi-level-dialog/multi-level-quota-input/multi-level-quota-input.component';
import { MultiLevelDateInputComponent } from './_dialogs/multi-level-dialog/multi-level-date-input/multi-level-date-input.component';
import { MultiLevelSelectInputComponent } from './_dialogs/multi-level-dialog/multi-level-select-input/multi-level-select-input.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { CustomMarkdownModule } from 'app/base/custom-markdown/custom-markdown.module';
import { ContextPipe } from 'app/base/i18n/context.pipe';
import { QwCommentComponent } from './questionwall/question-wall/support-components/qw-comment/qw-comment.component';
import { QwCommentFocusComponent } from './questionwall/question-wall/support-components/qw-comment-focus/qw-comment-focus.component';
import { M3BodyPaneComponent } from 'modules/m3/components/layout/m3-body-pane/m3-body-pane.component';
import { M3SupportingPaneComponent } from 'modules/m3/components/layout/m3-supporting-pane/m3-supporting-pane.component';
import { CommentListFabComponent } from './comment-list/comment-list-fab/comment-list-fab.component';
import { QwTopBarComponent } from './questionwall/question-wall/support-components/qw-top-bar/qw-top-bar.component';
import { QwBottomBarComponent } from './questionwall/question-wall/support-components/qw-bottom-bar/qw-bottom-bar.component';
import { AiChatComponent } from 'app/room/gptchat-room/ai-chat/ai-chat.component';
import { QwDefaultPlaceholderComponent } from './questionwall/question-wall/support-components/qw-default-placeholder/qw-default-placeholder.component';
import { CommentModule } from 'app/room/comment/comment.module';
import { TruncateBadgePipe } from 'app/utils/truncate-badge.pipe';

@NgModule({
  imports: [
    CommonModule,
    EssentialsModule,
    SharedRoutingModule,
    MatRippleModule,
    ArsModule,
    QRCodeComponent,
    ColorPickerModule,
    DragDropModule,
    JoyrideModule.forChild(),
    MatSliderModule,
    MatSlideToggleModule,
    CdkTrapFocus,
    CustomMarkdownModule,
    ContextPipe,
    QwCommentComponent,
    QwCommentFocusComponent,
    M3BodyPaneComponent,
    M3SupportingPaneComponent,
    CommentListFabComponent,
    QwTopBarComponent,
    QwBottomBarComponent,
    AiChatComponent,
    QwDefaultPlaceholderComponent,
    CommentModule,
    MatTimepickerModule,
    TruncateBadgePipe,
  ],
  declarations: [
    RoomJoinComponent,
    PageNotFoundComponent,
    RoomListComponent,
    CommentPageComponent,
    CommentListComponent,
    UserBonusTokenComponent,
    RemindOfTokensComponent,
    LoginComponent,
    CloudConfigurationComponent,
    CreateCommentComponent,
    DialogActionButtonsComponent,
    QrCodeDialogComponent,
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
    ScrollIntoViewDirective,
    DeepLDialogComponent,
    ExplanationDialogComponent,
    WorkerConfigDialogComponent,
    WordCloudComponent,
    AccessibilityEscapedInputDirective,
    TopicCloudBrainstormingComponent,
    IntroductionQuestionWallComponent,
    IntroductionQuestionWallDEComponent,
    IntroductionQuestionWallENComponent,
    IntroductionQuestionWallFRComponent,
    IntroductionRoomListComponent,
    IntroductionRoomListDEComponent,
    IntroductionRoomListENComponent,
    IntroductionRoomListFRComponent,
    IntroductionRoomPageComponent,
    IntroductionRoomPageDEComponent,
    IntroductionRoomPageENComponent,
    IntroductionRoomPageFRComponent,
    IntroductionCommentListComponent,
    IntroductionCommentListDEComponent,
    IntroductionCommentListENComponent,
    IntroductionCommentListFRComponent,
    IntroductionTagCloudComponent,
    IntroductionTagCloudDEComponent,
    IntroductionTagCloudENComponent,
    IntroductionTagCloudFRComponent,
    IntroductionBrainstormingComponent,
    IntroductionBrainstormingDEComponent,
    IntroductionBrainstormingENComponent,
    IntroductionBrainstormingFRComponent,
    IntroductionModerationComponent,
    IntroductionModerationDEComponent,
    IntroductionModerationENComponent,
    IntroductionModerationFRComponent,
    CommentNotificationDialogComponent,
    ToggleConversationComponent,
    DashboardComponent,
    DashboardDialogComponent,
    DeleteAllNotificationsComponent,
    RoomSettingsOverviewComponent,
    AppRatingComponent,
    AppRatingPopUpComponent,
    MinuteJumpClockComponent,
    PseudonymEditorComponent,
    BrainstormingBlacklistEditComponent,
    EditQuestionComponent,
    BrainstormingCategoryEditorComponent,
    BrainstormingEditComponent,
    BrainstormingDeleteConfirmComponent,
    FullscreenImageDialogComponent,
    NavigationComponent,
    QuestionWallComponent,
    LivepollCreateComponent,
    IntroductionPromptGuideChatbotComponent,
    IntroductionPromptGuideChatbotDeComponent,
    IntroductionPromptGuideChatbotEnComponent,
    IntroductionPromptGuideChatbotFrComponent,
    LivepollDialogComponent,
    LivepollSettingsComponent,
    GptOptInPrivacyComponent,
    GptPrivacyPolicyDeComponent,
    GptPrivacyPolicyEnComponent,
    GptPrivacyPolicyFrComponent,
    GPTChatRoomComponent,
    PresetsDialogComponent,
    GPTChatInfoComponent,
    LivepollConfirmationDialogComponent,
    LivepollStatisticComponent,
    LivepollSummaryComponent,
    MarkdownEditorComponent,
    MarkdownEditorDialogComponent,
    GPTPresetTopicsDialogComponent,
    GlobalStatusIndicatorComponent,
    StatusInfoComponent,
    GptPromptExplanationComponent,
    GptPromptExplanationDeComponent,
    GptPromptExplanationEnComponent,
    GptPromptExplanationFrComponent,
    GPTRatingDialogComponent,
    UtilityStyleTestComponent,
    ChatGPTBrainstormComponent,
    GPTConversationOverviewComponent,
    LivepollPeerInstructionWindowComponent,
    LivepollPeerInstructionComparisonComponent,
    MultiLevelDialogComponent,
    MultiLevelTextInputComponent,
    MultiLevelRadioSelectComponent,
    MultiLevelSwitchComponent,
    MultiLevelTextComponent,
    HelpRoomCreateComponent,
    HelpRoomCreateDeComponent,
    HelpRoomCreateEnComponent,
    HelpRoomCreateFrComponent,
    MultiLevelQuotaInputComponent,
    MultiLevelDateInputComponent,
    MultiLevelSelectInputComponent,
  ],
  exports: [
    RoomJoinComponent,
    PageNotFoundComponent,
    RoomListComponent,
    CommentPageComponent,
    CommentListComponent,
    CreateCommentComponent,
    DialogActionButtonsComponent,
    UserBonusTokenComponent,
    CloudConfigurationComponent,
    TagCloudPopUpComponent,
    ActiveUserComponent,
    MatSpinnerOverlayComponent,
    JoyrideTemplateDirective,
    AutofocusDirective,
    ScrollIntoViewDirective,
    WriteCommentComponent,
    AccessibilityEscapedInputDirective,
    DashboardComponent,
    AppRatingComponent,
    MinuteJumpClockComponent,
    GlobalStatusIndicatorComponent,
    MultiLevelDialogComponent,
    RoomSettingsOverviewComponent,
    LivepollCreateComponent,
    BrainstormingEditComponent,
  ],
})
export class SharedModule {
  constructor(
    private translateService: TranslateService,
    appState: AppStateService,
  ) {
    appState.language$.subscribe((lang) => {
      this.translateService.use(lang);
    });
  }
}
