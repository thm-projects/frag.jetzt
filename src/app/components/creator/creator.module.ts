import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreatorRoutingModule } from './creator-routing.module';
import { RoomCreatorPageComponent } from './room-creator-page/room-creator-page.component';
import { EssentialsModule } from '../essentials/essentials.module';
import { ModeratorModule } from '../moderator/moderator.module';
import { RoomDeleteComponent } from './_dialogs/room-delete/room-delete.component';
import { SharedModule } from '../shared/shared.module';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ModeratorsComponent } from './_dialogs/moderators/moderators.component';
import { BonusTokenComponent } from './_dialogs/bonus-token/bonus-token.component';
import { CommentSettingsComponent } from './_dialogs/comment-settings/comment-settings.component';
import { TagsComponent } from './_dialogs/tags/tags.component';
import { ModeratorDeleteComponent } from './_dialogs/moderator-delete/moderator-delete.component';
import { DeleteCommentComponent } from './_dialogs/delete-comment/delete-comment.component';
import { DeleteCommentsComponent } from './_dialogs/delete-comments/delete-comments.component';
import { BonusDeleteComponent } from './_dialogs/bonus-delete/bonus-delete.component';
import { MarkdownModule } from 'ngx-markdown';
import { DeleteAnswerComponent } from './_dialogs/delete-answer/delete-answer.component';
import { QuestionWallComponent } from '../shared/questionwall/question-wall/question-wall.component';
import { ArsModule } from '../../../../projects/ars/src/lib/ars.module';
import { MatRippleModule } from '@angular/material/core';
import { ProfanitySettingsComponent } from './_dialogs/profanity-settings/profanity-settings.component';
import {
  RoomDescriptionSettingsComponent
} from './_dialogs/room-description-settings/room-description-settings.component';
import { RoomNameSettingsComponent } from './_dialogs/room-name-settings/room-name-settings.component';
import { QRCodeModule } from 'angularx-qrcode';
import { EditCommentTagComponent } from './_dialogs/edit-comment-tag/edit-comment-tag.component';
import { ModeratorRefreshCodeComponent } from './_dialogs/moderator-refresh-code/moderator-refresh-code.component';
import { LanguageService } from '../../services/util/language.service';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const HttpLoaderFactory = (http: HttpClient) => new TranslateHttpLoader(http, '../../assets/i18n/creator/', '.json');

@NgModule({
  imports: [
    CommonModule,
    CreatorRoutingModule,
    EssentialsModule,
    SharedModule,
    ModeratorModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: (HttpLoaderFactory),
        deps: [HttpClient]
      },
      isolate: true
    }),
    MarkdownModule,
    ArsModule,
    MatRippleModule,
    QRCodeModule
  ],
  declarations: [
    RoomCreatorPageComponent,
    RoomDeleteComponent,
    ModeratorsComponent,
    BonusTokenComponent,
    CommentSettingsComponent,
    TagsComponent,
    ModeratorDeleteComponent,
    DeleteCommentsComponent,
    DeleteCommentComponent,
    BonusDeleteComponent,
    DeleteAnswerComponent,
    QuestionWallComponent,
    ProfanitySettingsComponent,
    RoomDescriptionSettingsComponent,
    RoomNameSettingsComponent,
    EditCommentTagComponent,
    ModeratorRefreshCodeComponent
  ],
  exports: []
})
export class CreatorModule {

  constructor(
    private languageService: LanguageService,
    private translateService: TranslateService,
  ) {
    this.languageService.getLanguage().subscribe(lang => {
      this.translateService.use(lang);
    });
  }

}
