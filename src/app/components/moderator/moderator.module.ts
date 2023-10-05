import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModeratorRoutingModule } from './moderator-routing.module';
import { RoomModeratorPageComponent } from './room-moderator-page/room-moderator-page.component';
import { ModeratorCommentListComponent } from './moderator-comment-list/moderator-comment-list.component';
import { ModeratorCommentPageComponent } from './moderator-comment-page/moderator-comment-page.component';
import { EssentialsModule } from '../essentials/essentials.module';
import { SharedModule } from '../shared/shared.module';
import {
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { MarkdownModule } from 'ngx-markdown';
import { ArsModule } from '../../../../projects/ars/src/lib/ars.module';
import { ModeratorJoinComponent } from './moderator-join/moderator-join.component';
import { AppStateService } from 'app/services/state/app-state.service';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const HttpLoaderFactory = (http: HttpClient) =>
  new TranslateHttpLoader(http, '../../assets/i18n/creator/', '.json');

@NgModule({
  imports: [
    CommonModule,
    ModeratorRoutingModule,
    EssentialsModule,
    SharedModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
      isolate: true,
    }),
    MarkdownModule,
    ArsModule,
  ],
  declarations: [
    RoomModeratorPageComponent,
    ModeratorCommentListComponent,
    ModeratorCommentPageComponent,
    ModeratorJoinComponent,
  ],
})
export class ModeratorModule {
  constructor(
    private translateService: TranslateService,
    appState: AppStateService,
  ) {
    appState.language$.subscribe((lang) => {
      this.translateService.use(lang);
    });
  }
}
