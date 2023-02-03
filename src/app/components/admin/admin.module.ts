import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreateMotdComponent } from './create-motd/create-motd.component';
import { AdminRoutingModule } from './admin-routing.module';
import { EssentialsModule } from '../essentials/essentials.module';
import { SharedModule } from '../shared/shared.module';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { MarkdownModule } from 'ngx-markdown';
import { ArsModule } from '../../../../projects/ars/src/lib/ars.module';
import { MatRippleModule } from '@angular/material/core';
import { QRCodeModule } from 'angularx-qrcode';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { NgxMatTimepickerModule } from '@angular-material-components/datetime-picker';
import { LanguageService } from '../../services/util/language.service';
import { GptConfigurationComponent } from './gpt-configuration/gpt-configuration.component';
import { AdminOverviewComponent } from './admin-overview/admin-overview.component';
import { GptChatComponent } from './gpt-chat/gpt-chat.component';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const HttpLoaderFactory = (http: HttpClient) =>
  new TranslateHttpLoader(http, '../../assets/i18n/admin/', '.json');

@NgModule({
  declarations: [
    CreateMotdComponent,
    GptConfigurationComponent,
    AdminOverviewComponent,
    GptChatComponent,
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    EssentialsModule,
    SharedModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      },
      isolate: true
    }),
    MarkdownModule,
    ArsModule,
    MatRippleModule,
    QRCodeModule,
    MatDatepickerModule,
    NgxMatTimepickerModule,
  ]
})
export class AdminModule {

  constructor(
    private languageService: LanguageService,
    private translateService: TranslateService,
  ) {
    this.languageService.getLanguage().subscribe(lang => {
      this.translateService.use(lang);
    });
  }

}
