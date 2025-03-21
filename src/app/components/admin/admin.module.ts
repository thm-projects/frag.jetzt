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
import { ArsModule } from '../../../../projects/ars/src/lib/ars.module';
import { MatRippleModule } from '@angular/material/core';
import { QRCodeComponent } from 'angularx-qrcode';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { GptConfigurationComponent } from './gpt-configuration/gpt-configuration.component';
import { AdminOverviewComponent } from './admin-overview/admin-overview.component';
import { AdminMailingComponent } from './admin-mailing/admin-mailing.component';
import { KeycloakProviderComponent } from './keycloak-provider/keycloak-provider.component';
import { AppStateService } from 'app/services/state/app-state.service';

export const HttpLoaderFactory = (http: HttpClient) =>
  new TranslateHttpLoader(http, '../../assets/i18n/admin/', '.json');

@NgModule({
  declarations: [
    CreateMotdComponent,
    GptConfigurationComponent,
    AdminOverviewComponent,
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
    ArsModule,
    MatRippleModule,
    QRCodeComponent,
    MatDatepickerModule,
    MatTimepickerModule,
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
