import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreatorRoutingModule } from './creator-routing.module';
import { AnswersListComponent } from './answers-list/answers-list.component';
import { ContentChoiceCreatorComponent } from './content-choice-creator/content-choice-creator.component';
import { ContentCreatePageComponent } from './content-create-page/content-create-page.component';
import { ContentLikertCreatorComponent } from './content-likert-creator/content-likert-creator.component';
import { ContentTextCreatorComponent } from './content-text-creator/content-text-creator.component';
import { ContentYesNoCreatorComponent } from './content-yes-no-creator/content-yes-no-creator.component';
import { HomeCreatorPageComponent } from './home-creator-page/home-creator-page.component';
import { MarkdownToolbarComponent } from './markdown-toolbar/markdown-toolbar.component';
import { RoomCreatorPageComponent } from './room-creator-page/room-creator-page.component';
import { EssentialsModule } from '../essentials/essentials.module';
import { RoomCreateComponent } from './_dialogs/room-create/room-create.component';
import { RoomDeleteComponent } from './_dialogs/room-delete/room-delete.component';
import { RoomEditComponent } from './_dialogs/room-edit/room-edit.component';
import { AnswerEditComponent } from '../participant/_dialogs/answer-edit/answer-edit.component';
import { ContentDeleteComponent } from './_dialogs/content-delete/content-delete.component';
import { CreatorContentCarouselPageComponent } from './creator-content-carousel-page/creator-content-carousel-page.component';
import { SharedModule } from '../shared/shared.module';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

@NgModule({
  imports: [
    CommonModule,
    CreatorRoutingModule,
    EssentialsModule,
    SharedModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      },
      isolate: true
    })
  ],
  declarations: [
    AnswersListComponent,
    ContentChoiceCreatorComponent,
    ContentCreatePageComponent,
    ContentLikertCreatorComponent,
    ContentTextCreatorComponent,
    ContentYesNoCreatorComponent,
    HomeCreatorPageComponent,
    MarkdownToolbarComponent,
    RoomCreatorPageComponent,
    RoomCreateComponent,
    RoomDeleteComponent,
    RoomEditComponent,
    CreatorContentCarouselPageComponent
  ],
  entryComponents: [
    RoomCreateComponent,
    RoomDeleteComponent,
    RoomEditComponent,
    AnswerEditComponent,
    ContentDeleteComponent
  ]
})
export class CreatorModule {
}

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, '../../../assets/i18n/', '.json');
}
