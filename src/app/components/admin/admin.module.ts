import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreateMotdComponent } from './create-motd/create-motd.component';
import { AdminRoutingModule } from './admin-routing.module';
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
import { MatRippleModule } from '@angular/material/core';
import { QRCodeModule } from 'angularx-qrcode';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { NgxMatTimepickerModule } from '@angular-material-components/datetime-picker';
import { GptConfigurationComponent } from './gpt-configuration/gpt-configuration.component';
import { AdminOverviewComponent } from './admin-overview/admin-overview.component';
import { GptChatComponent } from './gpt-chat/gpt-chat.component';
import { AdminMailingComponent } from './admin-mailing/admin-mailing.component';
import { KeycloakProviderComponent } from './keycloak-provider/keycloak-provider.component';
import { AppStateService } from 'app/services/state/app-state.service';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const HttpLoaderFactory = (http: HttpClient) =>
  new TranslateHttpLoader(http, '../../assets/i18n/admin/', '.json');

@NgModule({
  declarations: [
    CreateMotdComponent,
    GptConfigurationComponent,
    AdminOverviewComponent,
    GptChatComponent,
    AdminMailingComponent,
    KeycloakProviderComponent,
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
        deps: [HttpClient],
      },
      isolate: true,
    }),
    MarkdownModule,
    ArsModule,
    MatRippleModule,
    QRCodeModule,
    MatDatepickerModule,
    NgxMatTimepickerModule,
  ],
})
export class AdminModule {
  constructor(
    private appState: AppStateService,
    private translateService: TranslateService,
  ) {
    this.appState.language$.subscribe((lang) => {
      this.translateService.use(lang);
    });
  }
}
