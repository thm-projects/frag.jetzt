// Angular imports
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatRippleModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatTimepickerModule } from '@angular/material/timepicker';

// Third-party libraries
import { JoyrideModule } from 'ngx-joyride';
import { ColorPickerComponent, ColorPickerDirective } from 'ngx-color-picker';
import { QRCodeComponent } from 'angularx-qrcode';
import { TranslateService } from '@ngx-translate/core';

// Application imports - core services
import { AppStateService } from 'app/services/state/app-state.service';
import { ContextPipe } from 'app/base/i18n/context.pipe';
import { CustomMarkdownModule } from 'app/base/custom-markdown/custom-markdown.module';
import { TruncateBadgePipe } from 'app/utils/truncate-badge.pipe';

// Application imports - modules
import { ArsModule } from '../../../../projects/ars/src/lib/ars.module';
import { CommentModule } from 'app/room/comment/comment.module';
import { EssentialsModule } from '../essentials/essentials.module';
import { SharedRoutingModule } from './shared-routing.module';

// Application imports - components (M3)
import { M3BodyPaneComponent } from 'modules/m3/components/layout/m3-body-pane/m3-body-pane.component';
import { M3SupportingPaneComponent } from 'modules/m3/components/layout/m3-supporting-pane/m3-supporting-pane.component';

// Application imports - directives
import { AccessibilityEscapedInputDirective } from '../../directives/accessibility-escaped-input.directive';
import { AutofocusDirective } from '../../directives/autofocus.directive';
import { JoyrideTemplateDirective } from '../../directives/joyride-template.directive';
import { ScrollIntoViewDirective } from '../../directives/scroll-into-view.directive';

// Application imports - components (shared)
import { AiChatComponent } from 'app/room/gptchat-room/ai-chat/ai-chat.component';
import { ActiveUserComponent } from './overlay/active-user/active-user.component';
import { AppRatingComponent } from './app-rating/app-rating.component';
import { AppRatingPopUpComponent } from './_dialogs/app-rating-pop-up/app-rating-pop-up.component';
import { BrainstormingBlacklistEditComponent } from './_dialogs/brainstorming-blacklist-edit/brainstorming-blacklist-edit.component';
import { BrainstormingCategoryEditorComponent } from './_dialogs/brainstorming-category-editor/brainstorming-category-editor.component';
import { BrainstormingDeleteConfirmComponent } from './_dialogs/brainstorming-delete-confirm/brainstorming-delete-confirm.component';
import { BrainstormingEditComponent } from './_dialogs/brainstorming-edit/brainstorming-edit.component';
import { ChatGPTBrainstormComponent } from './_dialogs/chat-gptbrainstorm/chat-gptbrainstorm.component';
import { CloudConfigurationComponent } from './_dialogs/cloud-configuration/cloud-configuration.component';
import { CommentAnswerComponent } from './comment-answer/comment-answer.component';
import { CommentListComponent } from './comment-list/comment-list.component';
import { CommentListFabComponent } from './comment-list/comment-list-fab/comment-list-fab.component';
import { CommentNotificationDialogComponent } from './_dialogs/comment-notification-dialog/comment-notification-dialog.component';
import { CommentPageComponent } from './comment-page/comment-page.component';
import { CreateCommentComponent } from './_dialogs/create-comment/create-comment.component';
import { DashboardComponent } from './_dialogs/dashboard/dashboard.component';
import { DashboardDialogComponent } from './_dialogs/dashboard-dialog/dashboard-dialog.component';
import { DeleteAllNotificationsComponent } from './_dialogs/delete-all-notifications/delete-all-notifications.component';
import { DialogActionButtonsComponent } from './dialog/dialog-action-buttons/dialog-action-buttons.component';
import { EditQuestionComponent } from './_dialogs/edit-question/edit-question.component';
import { ExplanationDialogComponent } from './_dialogs/explanation-dialog/explanation-dialog.component';
import { FullscreenImageDialogComponent } from './_dialogs/fullscreen-image-dialog/fullscreen-image-dialog.component';
import { GlobalStatusIndicatorComponent } from './global-status-indicator/global-status-indicator.component';
import { GPTChatRoomComponent } from '../../room/gptchat-room/gptchat-room.component';
import { GptOptInPrivacyComponent } from './_dialogs/gpt-optin-privacy/gpt-optin-privacy.component';
import { GptPrivacyPolicyDeComponent } from '../../../assets/i18n/components/gpt-privacy-policy/gpt-privacy-policy-de';
import { GptPrivacyPolicyEnComponent } from '../../../assets/i18n/components/gpt-privacy-policy/gpt-privacy-policy-en';
import { GptPrivacyPolicyFrComponent } from '../../../assets/i18n/components/gpt-privacy-policy/gpt-privacy-policy-fr';
import { GptPromptExplanationDeComponent } from '../../../assets/i18n/components/gpt-prompt-explanation/gpt-prompt-explanation-de';
import { GptPromptExplanationEnComponent } from '../../../assets/i18n/components/gpt-prompt-explanation/gpt-prompt-explanation-en';
import { GptPromptExplanationFrComponent } from '../../../assets/i18n/components/gpt-prompt-explanation/gpt-prompt-explanation-fr';
import { HelpRoomCreateComponent } from './_dialogs/room-create/help-room-create/help-room-create.component';
import { HelpRoomCreateDeComponent } from './_dialogs/room-create/help-room-create/help-room-create-de/help-room-create-de.component';
import { HelpRoomCreateEnComponent } from './_dialogs/room-create/help-room-create/help-room-create-en/help-room-create-en.component';
import { HelpRoomCreateFrComponent } from './_dialogs/room-create/help-room-create/help-room-create-fr/help-room-create-fr.component';
import { IntroductionBrainstormingComponent } from './_dialogs/introductions/introduction-brainstorming/introduction-brainstorming.component';
import { IntroductionBrainstormingDEComponent } from '../../../assets/i18n/components/_dialogs/introductions/introduction-brainstorming/introduction-brainstorming-de.component';
import { IntroductionBrainstormingENComponent } from '../../../assets/i18n/components/_dialogs/introductions/introduction-brainstorming/introduction-brainstorming-en.component';
import { IntroductionBrainstormingFRComponent } from '../../../assets/i18n/components/_dialogs/introductions/introduction-brainstorming/introduction-brainstorming-fr.component';
import { IntroductionTagCloudComponent } from './_dialogs/introductions/introduction-tag-cloud/introduction-tag-cloud.component';
import { IntroductionTagCloudDEComponent } from '../../../assets/i18n/components/_dialogs/introductions/introduction-tag-cloud/introduction-tag-cloud-de.component';
import { IntroductionTagCloudENComponent } from '../../../assets/i18n/components/_dialogs/introductions/introduction-tag-cloud/introduction-tag-cloud-en.component';
import { IntroductionTagCloudFRComponent } from '../../../assets/i18n/components/_dialogs/introductions/introduction-tag-cloud/introduction-tag-cloud-fr.component';
import { JoyrideTemplateComponent } from './_dialogs/joyride-template/joyride-template.component';
import { LivepollConfirmationDialogComponent } from './_dialogs/livepoll/livepoll-confirmation-dialog/livepoll-confirmation-dialog.component';
import { LivepollCreateComponent } from './_dialogs/livepoll/livepoll-create/livepoll-create.component';
import { LivepollDialogComponent } from './_dialogs/livepoll/livepoll-dialog/livepoll-dialog.component';
import { LivepollPeerInstructionComparisonComponent } from './_dialogs/livepoll/livepoll-peer-instruction/livepoll-peer-instruction-comparison/livepoll-peer-instruction-comparison.component';
import { LivepollPeerInstructionWindowComponent } from './_dialogs/livepoll/livepoll-peer-instruction/livepoll-peer-instruction-window/livepoll-peer-instruction-window.component';
import { LivepollSettingsComponent } from './_dialogs/livepoll/livepoll-settings/livepoll-settings.component';
import { LivepollStatisticComponent } from './_dialogs/livepoll/livepoll-statistic/livepoll-statistic.component';
import { LivepollSummaryComponent } from './_dialogs/livepoll/livepoll-summary/livepoll-summary.component';
import { LoginComponent } from './login/login.component';
import { MarkdownEditorComponent } from './utility/markdown/markdown-editor/markdown-editor.component';
import { MarkdownEditorDialogComponent } from './utility/markdown/markdown-editor-dialog/markdown-editor-dialog.component';
import { MatSpinnerOverlayComponent } from './mat-spinner-overlay/mat-spinner-overlay.component';
import { MinuteJumpClockComponent } from './minute-jump-clock/minute-jump-clock.component';
import { MotdDialogComponent } from './_dialogs/motd-dialog/motd-dialog.component';
import { MotdMessageComponent } from './_dialogs/motd-dialog/motd-message/motd-message.component';
import { MultiLevelDialogComponent } from './_dialogs/multi-level-dialog/multi-level-dialog.component';
import { MultiLevelQuotaInputComponent } from './_dialogs/multi-level-dialog/multi-level-quota-input/multi-level-quota-input.component';
import { MultiLevelRadioSelectComponent } from './_dialogs/multi-level-dialog/multi-level-radio-select/multi-level-radio-select.component';
import { MultiLevelSelectInputComponent } from './_dialogs/multi-level-dialog/multi-level-select-input/multi-level-select-input.component';
import { MultiLevelSwitchComponent } from './_dialogs/multi-level-dialog/multi-level-switch/multi-level-switch.component';
import { MultiLevelTextComponent } from './_dialogs/multi-level-dialog/multi-level-text/multi-level-text.component';
import { MultiLevelTextInputComponent } from './_dialogs/multi-level-dialog/multi-level-text-input/multi-level-text-input.component';
import { NavigationComponent } from './navigation/navigation.component';
import { PresetsDialogComponent } from './_dialogs/presets-dialog/presets-dialog.component';
import { PseudonymEditorComponent } from './_dialogs/pseudonym-editor/pseudonym-editor.component';
import { QrCodeDialogComponent } from './_dialogs/qr-code-dialog/qr-code-dialog.component';
import { QuestionWallComponent } from './questionwall/question-wall/question-wall.component';
import { QwBottomBarComponent } from './questionwall/question-wall/support-components/qw-bottom-bar/qw-bottom-bar.component';
import { QwCommentComponent } from './questionwall/question-wall/support-components/qw-comment/qw-comment.component';
import { QwCommentFocusComponent } from './questionwall/question-wall/support-components/qw-comment-focus/qw-comment-focus.component';
import { QwDefaultPlaceholderComponent } from './questionwall/question-wall/support-components/qw-default-placeholder/qw-default-placeholder.component';
import { QwTopBarComponent } from './questionwall/question-wall/support-components/qw-top-bar/qw-top-bar.component';
import { RemindOfTokensComponent } from '../participant/_dialogs/remind-of-tokens/remind-of-tokens.component';
import { RoomJoinComponent } from './room-join/room-join.component';
import { RoomListComponent } from './room-list/room-list.component';
import { RoomSettingsOverviewComponent } from './_dialogs/room-settings-overview/room-settings-overview.component';
import { StatusInfoComponent } from './_dialogs/status-info/status-info.component';
import { TagCloudComponent } from '../../room/tag-cloud/tag-cloud.component';
import { TagCloudPopUpComponent } from '../../room/tag-cloud/tag-cloud-pop-up/tag-cloud-pop-up.component';
import { ToggleConversationComponent } from '../creator/_dialogs/toggle-conversation/toggle-conversation.component';
import { TopicCloudAdministrationComponent } from './_dialogs/topic-cloud-administration/topic-cloud-administration.component';
import { TopicCloudBrainstormingComponent } from '../../room/tag-cloud/dialogs/topic-cloud-brainstorming/topic-cloud-brainstorming.component';
import { TopicCloudConfirmDialogComponent } from './_dialogs/topic-cloud-confirm-dialog/topic-cloud-confirm-dialog.component';
import { TopicCloudFilterComponent } from '../../room/tag-cloud/dialogs/topic-cloud-filter/topic-cloud-filter.component';
import { TopicDialogCommentComponent } from './dialog/topic-dialog-comment/topic-dialog-comment.component';
import { UserBonusTokenComponent } from '../participant/_dialogs/user-bonus-token/user-bonus-token.component';
import { UtilityStyleTestComponent } from './utility/style/utility-style-test/utility-style-test.component';
import { WordCloudComponent } from '../../room/tag-cloud/word-cloud/word-cloud.component';
import { WorkerConfigDialogComponent } from './_dialogs/worker-config-dialog/worker-config-dialog.component';
import { WorkerDialogComponent } from './_dialogs/worker-dialog/worker-dialog.component';
import { WriteCommentComponent } from './write-comment/write-comment.component';

@NgModule({
  imports: [
    AiChatComponent,
    ArsModule,
    CdkTrapFocus,
    ColorPickerComponent,
    ColorPickerDirective,
    CommentListFabComponent,
    CommentModule,
    CommonModule,
    ContextPipe,
    CustomMarkdownModule,
    DragDropModule,
    EssentialsModule,
    JoyrideModule.forChild(),
    M3BodyPaneComponent,
    M3SupportingPaneComponent,
    MatRippleModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatTimepickerModule,
    QRCodeComponent,
    QwBottomBarComponent,
    QwCommentComponent,
    QwCommentFocusComponent,
    QwDefaultPlaceholderComponent,
    QwTopBarComponent,
    SharedRoutingModule,
    TruncateBadgePipe,
  ],
  declarations: [
    AccessibilityEscapedInputDirective,
    ActiveUserComponent,
    AppRatingComponent,
    AppRatingPopUpComponent,
    AutofocusDirective,
    BrainstormingBlacklistEditComponent,
    BrainstormingCategoryEditorComponent,
    BrainstormingDeleteConfirmComponent,
    BrainstormingEditComponent,
    ChatGPTBrainstormComponent,
    CloudConfigurationComponent,
    CommentAnswerComponent,
    CommentListComponent,
    CommentNotificationDialogComponent,
    CommentPageComponent,
    CreateCommentComponent,
    DashboardComponent,
    DashboardDialogComponent,
    DeleteAllNotificationsComponent,
    DialogActionButtonsComponent,
    EditQuestionComponent,
    ExplanationDialogComponent,
    FullscreenImageDialogComponent,
    GlobalStatusIndicatorComponent,
    GPTChatRoomComponent,
    GptOptInPrivacyComponent,
    GptPrivacyPolicyDeComponent,
    GptPrivacyPolicyEnComponent,
    GptPrivacyPolicyFrComponent,
    GptPromptExplanationDeComponent,
    GptPromptExplanationEnComponent,
    GptPromptExplanationFrComponent,
    HelpRoomCreateComponent,
    HelpRoomCreateDeComponent,
    HelpRoomCreateEnComponent,
    HelpRoomCreateFrComponent,
    IntroductionBrainstormingComponent,
    IntroductionBrainstormingDEComponent,
    IntroductionBrainstormingENComponent,
    IntroductionBrainstormingFRComponent,
    IntroductionTagCloudComponent,
    IntroductionTagCloudDEComponent,
    IntroductionTagCloudENComponent,
    IntroductionTagCloudFRComponent,
    JoyrideTemplateComponent,
    JoyrideTemplateDirective,
    LivepollConfirmationDialogComponent,
    LivepollCreateComponent,
    LivepollDialogComponent,
    LivepollPeerInstructionComparisonComponent,
    LivepollPeerInstructionWindowComponent,
    LivepollSettingsComponent,
    LivepollStatisticComponent,
    LivepollSummaryComponent,
    LoginComponent,
    MarkdownEditorComponent,
    MarkdownEditorDialogComponent,
    MatSpinnerOverlayComponent,
    MinuteJumpClockComponent,
    MotdDialogComponent,
    MotdMessageComponent,
    MultiLevelDialogComponent,
    MultiLevelQuotaInputComponent,
    MultiLevelRadioSelectComponent,
    MultiLevelSelectInputComponent,
    MultiLevelSwitchComponent,
    MultiLevelTextComponent,
    MultiLevelTextInputComponent,
    NavigationComponent,
    PresetsDialogComponent,
    PseudonymEditorComponent,
    QrCodeDialogComponent,
    QuestionWallComponent,
    RemindOfTokensComponent,
    RoomJoinComponent,
    RoomListComponent,
    RoomSettingsOverviewComponent,
    ScrollIntoViewDirective,
    StatusInfoComponent,
    TagCloudComponent,
    TagCloudPopUpComponent,
    ToggleConversationComponent,
    TopicCloudAdministrationComponent,
    TopicCloudBrainstormingComponent,
    TopicCloudConfirmDialogComponent,
    TopicCloudFilterComponent,
    TopicDialogCommentComponent,
    UserBonusTokenComponent,
    UtilityStyleTestComponent,
    WordCloudComponent,
    WorkerConfigDialogComponent,
    WorkerDialogComponent,
    WriteCommentComponent,
  ],
  exports: [
    AccessibilityEscapedInputDirective,
    ActiveUserComponent,
    AppRatingComponent,
    AutofocusDirective,
    BrainstormingEditComponent,
    CloudConfigurationComponent,
    CommentListComponent,
    CommentPageComponent,
    CreateCommentComponent,
    DashboardComponent,
    DialogActionButtonsComponent,
    GlobalStatusIndicatorComponent,
    JoyrideTemplateDirective,
    LivepollCreateComponent,
    MatSpinnerOverlayComponent,
    MinuteJumpClockComponent,
    MultiLevelDialogComponent,
    RoomJoinComponent,
    RoomListComponent,
    RoomSettingsOverviewComponent,
    ScrollIntoViewDirective,
    TagCloudPopUpComponent,
    UserBonusTokenComponent,
    WriteCommentComponent,
  ],
})
export class SharedModule {
  constructor(
    private readonly translateService: TranslateService,
    appState: AppStateService,
  ) {
    appState.language$.subscribe((lang) => {
      this.translateService.use(lang);
    });
  }
}
