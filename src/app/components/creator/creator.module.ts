import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreatorRoutingModule } from './creator-routing.module';
import { ContentChoiceCreatorComponent } from './content-choice-creator/content-choice-creator.component';
import { ContentCreatePageComponent } from './content-create-page/content-create-page.component';
import { ContentLikertCreatorComponent } from './content-likert-creator/content-likert-creator.component';
import { ContentTextCreatorComponent } from './content-text-creator/content-text-creator.component';
import { ContentYesNoCreatorComponent } from './content-yes-no-creator/content-yes-no-creator.component';
import { HomeCreatorPageComponent } from './home-creator-page/home-creator-page.component';
import { RoomCreatorPageComponent } from './room-creator-page/room-creator-page.component';
import { EssentialsModule } from '../essentials/essentials.module';
import { RoomDeleteComponent } from './_dialogs/room-delete/room-delete.component';
import { RoomEditComponent } from './_dialogs/room-edit/room-edit.component';
import { AnswerEditComponent } from './_dialogs/answer-edit/answer-edit.component';
import { ContentDeleteComponent } from './_dialogs/content-delete/content-delete.component';
import { SharedModule } from '../shared/shared.module';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ContentCreatorComponent } from './content-creator/content-creator.component';
import { ContentListComponent } from './content-list/content-list.component';
import { ContentEditComponent } from './_dialogs/content-edit/content-edit.component';

@NgModule({
  imports: [
    CommonModule,
    CreatorRoutingModule,
    EssentialsModule,
    SharedModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: (HttpLoaderFactory),
        deps: [HttpClient]
      },
      isolate: true
    })
  ],
  declarations: [
    ContentChoiceCreatorComponent,
    ContentCreatePageComponent,
    ContentLikertCreatorComponent,
    ContentTextCreatorComponent,
    ContentYesNoCreatorComponent,
    HomeCreatorPageComponent,
    RoomCreatorPageComponent,
    RoomDeleteComponent,
    RoomEditComponent,
    ContentCreatorComponent,
    ContentListComponent,
    ContentEditComponent
  ],
  entryComponents: [
    RoomDeleteComponent,
    RoomEditComponent,
    AnswerEditComponent,
    ContentDeleteComponent,
    ContentChoiceCreatorComponent,
    ContentLikertCreatorComponent,
    ContentTextCreatorComponent,
    ContentYesNoCreatorComponent,
    ContentEditComponent
  ]
})
export class CreatorModule {
}

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, '../../assets/i18n/creator/', '.json');
}
