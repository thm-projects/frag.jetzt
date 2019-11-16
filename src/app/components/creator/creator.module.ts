import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreatorRoutingModule } from './creator-routing.module';
import { RoomCreatorPageComponent } from './room-creator-page/room-creator-page.component';
import { EssentialsModule } from '../essentials/essentials.module';
import { ModeratorModule } from '../moderator/moderator.module';
import { RoomDeleteComponent } from './_dialogs/room-delete/room-delete.component';
import { RoomEditComponent } from './_dialogs/room-edit/room-edit.component';
import { SharedModule } from '../shared/shared.module';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { CommentExportComponent } from './_dialogs/comment-export/comment-export.component';
import { ModeratorsComponent } from './_dialogs/moderators/moderators.component';
import { BonusTokenComponent } from './_dialogs/bonus-token/bonus-token.component';
import { CommentSettingsComponent } from './_dialogs/comment-settings/comment-settings.component';
import { TagsComponent } from './_dialogs/tags/tags.component';
import { ModeratorDeleteComponent } from './_dialogs/moderator-delete/moderator-delete.component';
import { DeleteCommentComponent } from './_dialogs/delete-comment/delete-comment.component';
import { DeleteCommentsComponent } from './_dialogs/delete-comments/delete-comments.component';
import { CommentAnswerFormComponent } from './_dialogs/comment-answer-form/comment-answer-form.component';
import { BonusDeleteComponent } from './_dialogs/bonus-delete/bonus-delete.component';
import { MarkdownModule } from 'ngx-markdown';

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
    MarkdownModule
  ],
  declarations: [
    RoomCreatorPageComponent,
    RoomDeleteComponent,
    RoomEditComponent,
    CommentExportComponent,
    ModeratorsComponent,
    BonusTokenComponent,
    CommentSettingsComponent,
    TagsComponent,
    ModeratorDeleteComponent,
    DeleteCommentsComponent,
    DeleteCommentComponent,
    BonusDeleteComponent,
    CommentAnswerFormComponent,
  ],
  exports: [],
  entryComponents: [
    RoomDeleteComponent,
    RoomEditComponent,
    CommentExportComponent,
    ModeratorsComponent,
    BonusTokenComponent,
    CommentSettingsComponent,
    ModeratorDeleteComponent,
    TagsComponent,
    DeleteCommentsComponent,
    DeleteCommentComponent,
    BonusDeleteComponent,
    CommentAnswerFormComponent
  ]
})
export class CreatorModule {
}

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, '../../assets/i18n/creator/', '.json');
}
