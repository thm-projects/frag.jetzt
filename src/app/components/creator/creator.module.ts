import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreatorRoutingModule } from './creator-routing.module';
import { EssentialsModule } from '../essentials/essentials.module';
import { ModeratorModule } from '../moderator/moderator.module';
import { SharedModule } from '../shared/shared.module';
import {
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ModeratorsComponent } from '../shared/_dialogs/moderators/moderators.component';
import { BonusTokenComponent } from './_dialogs/bonus-token/bonus-token.component';
import { CommentSettingsComponent } from './_dialogs/comment-settings/comment-settings.component';
import { ModeratorDeleteComponent } from './_dialogs/moderator-delete/moderator-delete.component';
import { DeleteCommentComponent } from './_dialogs/delete-comment/delete-comment.component';
import { DeleteCommentsComponent } from './_dialogs/delete-comments/delete-comments.component';
import { BonusDeleteComponent } from './_dialogs/bonus-delete/bonus-delete.component';
import { DeleteAnswerComponent } from './_dialogs/delete-answer/delete-answer.component';
import { ArsModule } from '../../../../projects/ars/src/lib/ars.module';
import { MatRippleModule } from '@angular/material/core';
import { ProfanitySettingsComponent } from './_dialogs/profanity-settings/profanity-settings.component';
import { RoomDescriptionSettingsComponent } from './_dialogs/room-description-settings/room-description-settings.component';
import { RoomNameSettingsComponent } from './_dialogs/room-name-settings/room-name-settings.component';
import { QRCodeComponent } from 'angularx-qrcode';
import { EditCommentTagComponent } from './_dialogs/edit-comment-tag/edit-comment-tag.component';
import { ModeratorRefreshCodeComponent } from './_dialogs/moderator-refresh-code/moderator-refresh-code.component';
import { DeleteModerationCommentsComponent } from './_dialogs/delete-moderation-comments/delete-moderation-comments.component';
import { AppStateService } from 'app/services/state/app-state.service';
import { SpendingWidgetComponent } from './spending-widget/spending-widget.component';
import { CustomMarkdownModule } from 'app/base/custom-markdown/custom-markdown.module';
import { MatDialogModule } from '@angular/material/dialog';
import { ContextPipe } from 'app/base/i18n/context.pipe';

export const HttpLoaderFactory = (http: HttpClient) =>
  new TranslateHttpLoader(http, '../../assets/i18n/creator/', '.json');

@NgModule({
  imports: [
    CommonModule,
    ContextPipe,
    CreatorRoutingModule,
    EssentialsModule,
    SharedModule,
    ModeratorModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
      isolate: true,
    }),
    ArsModule,
    MatRippleModule,
    QRCodeComponent,
    SpendingWidgetComponent,
    CustomMarkdownModule,
    MatDialogModule,
  ],
  declarations: [
    ModeratorsComponent,
    BonusTokenComponent,
    CommentSettingsComponent,
    ModeratorDeleteComponent,
    DeleteCommentsComponent,
    DeleteCommentComponent,
    BonusDeleteComponent,
    DeleteAnswerComponent,
    ProfanitySettingsComponent,
    RoomDescriptionSettingsComponent,
    RoomNameSettingsComponent,
    EditCommentTagComponent,
    ModeratorRefreshCodeComponent,
    DeleteModerationCommentsComponent,
  ],
  exports: [],
})
export class CreatorModule {
  constructor(
    appState: AppStateService,
    private translateService: TranslateService,
  ) {
    appState.language$.subscribe((lang) => {
      this.translateService.use(lang);
    });
  }
}
