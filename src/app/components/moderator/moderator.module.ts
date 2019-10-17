import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModeratorRoutingModule } from './moderator-routing.module';
import { RoomModeratorPageComponent } from './room-moderator-page/room-moderator-page.component';
import { ModeratorCommentListComponent } from './moderator-comment-list/moderator-comment-list.component';
import { ModeratorCommentPageComponent } from './moderator-comment-page/moderator-comment-page.component';
import { EssentialsModule } from '../essentials/essentials.module';
import { SharedModule } from '../shared/shared.module';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { MarkdownModule } from 'ngx-markdown';

@NgModule({
  imports: [
    CommonModule,
    ModeratorRoutingModule,
    EssentialsModule,
    SharedModule,
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
    RoomModeratorPageComponent,
    ModeratorCommentListComponent,
    ModeratorCommentPageComponent
  ]
})
export class ModeratorModule {
}

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, '../../assets/i18n/creator/', '.json');
}
