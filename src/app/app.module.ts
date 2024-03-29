import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import {
  HTTP_INTERCEPTORS,
  HttpClient,
  HttpClientModule,
} from '@angular/common/http';
import { UserService } from './services/http/user.service';
import { NotificationService } from './services/util/notification.service';
import { AuthenticationService } from './services/http/authentication.service';
import { AuthenticationGuard } from './guards/authentication.guard';
import { RoomService } from './services/http/room.service';
import { CommentService } from './services/http/comment.service';
import { DataStoreService } from './services/util/data-store.service';
import { EventService } from './services/util/event.service';
import { VoteService } from './services/http/vote.service';
import { WsConnectorService } from './services/websockets/ws-connector.service';
import { AuthenticationInterceptor } from './interceptors/authentication.interceptor';
import { EssentialsModule } from './components/essentials/essentials.module';
import { SharedModule } from './components/shared/shared.module';
import { CreatorModule } from './components/creator/creator.module';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MarkdownModule, MarkdownService, MarkedOptions } from 'ngx-markdown';
import { NewLandingComponent } from './components/home/new-landing/new-landing.component';
import { HomePageComponent } from './components/home/home-page/home-page.component';
import { UserHomeComponent } from './components/home/user-home/user-home.component';
import { AppConfig } from './app.config';
import { ThemeModule } from '../theme/theme.module';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { ModeratorService } from './services/http/moderator.service';
import {
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { DemoVideoComponent } from './components/home/_dialogs/demo-video/demo-video.component';
import { HomeCreatorPageComponent } from './components/home/home-creator-page/home-creator-page.component';
import { HomeParticipantPageComponent } from './components/home/home-participant-page/home-participant-page.component';
import { BonusTokenService } from './services/http/bonus-token.service';
import { CustomIconService } from './services/util/custom-icon.service';
import { ModeratorModule } from './components/moderator/moderator.module';
import { ImprintComponent } from './components/home/_dialogs/imprint/imprint.component';
import { DataProtectionComponent } from './components/home/_dialogs/data-protection/data-protection.component';
import { CookiesComponent } from './components/home/_dialogs/cookies/cookies.component';
import { DataProtectionEnComponent } from '../assets/i18n/components/data-protection/data-protection-en';
import { DataProtectionDeComponent } from '../assets/i18n/components/data-protection/data-protection-de';
import { CookiesEnComponent } from '../assets/i18n/components/cookies/cookies-en';
import { CookiesDeComponent } from '../assets/i18n/components/cookies/cookies-de';
import { ImprintEnComponent } from '../assets/i18n/components/imprint/imprint-en';
import { ImprintDeComponent } from '../assets/i18n/components/imprint/imprint-de';
import { HelpDeComponent } from '../assets/i18n/components/help/help-de';
import { HelpEnComponent } from '../assets/i18n/components/help/help-en';
import { OverlayComponent } from './components/home/_dialogs/overlay/overlay.component';
import { DemoDeComponent } from '../assets/i18n/components/demo/demo-de';
import { DemoEnComponent } from '../assets/i18n/components/demo/demo-en';
import { ArsModule } from '../../projects/ars/src/lib/ars.module';
import { MatIconModule } from '@angular/material/icon';
import { MatomoModule } from 'ngx-matomo-v9';
import { TagCloudModule } from 'angular-tag-cloud-module';
import { SpacyService } from './services/http/spacy.service';
import { QuizNowComponent } from './components/shared/quiz-now/quiz-now.component';
import { JoyrideModule } from 'ngx-joyride';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { DashboardNotificationService } from './services/util/dashboard-notification.service';
import { MatNativeDateModule, MatRippleModule } from '@angular/material/core';
import { NotifyUnsupportedBrowserComponent } from './components/home/_dialogs/notify-unsupported-browser/notify-unsupported-browser.component';
import { ImprintFrComponent } from '../assets/i18n/components/imprint/imprint-fr';
import { HelpFrComponent } from '../assets/i18n/components/help/help-fr';
import { DemoFrComponent } from '../assets/i18n/components/demo/demo-fr';
import { DataProtectionFrComponent } from '../assets/i18n/components/data-protection/data-protection-fr';
import { CookiesFrComponent } from '../assets/i18n/components/cookies/cookies-fr';
import { AdminModule } from './components/admin/admin.module';
import {
  HIGHLIGHT_OPTIONS,
  HighlightLoader,
  HighlightModule,
} from 'ngx-highlightjs';
import { HighlightJsDefaults } from './utils/highlight-js-defaults';

import 'prismjs';
import 'prismjs/plugins/line-numbers/prism-line-numbers.js';
import 'prismjs/plugins/line-highlight/prism-line-highlight.js';
import 'katex/dist/katex.min.js';
import 'emoji-toolkit/lib/js/joypixels.min.js';
import 'quill-emoji/dist/quill-emoji.js';
import { QuillModule } from 'ngx-quill';
import { AskOnboardingComponent } from './components/home/_dialogs/ask-onboarding/ask-onboarding.component';
import { AskOnboardingDEComponent } from 'assets/i18n/components/ask-onboarding/ask-onboarding-de.component';
import { AskOnboardingENComponent } from 'assets/i18n/components/ask-onboarding/ask-onboarding-en.component';
import { AskOnboardingFRComponent } from 'assets/i18n/components/ask-onboarding/ask-onboarding-fr.component';
import { UpdateInfoDialogComponent } from './components/home/_dialogs/update-info-dialog/update-info-dialog.component';
import { AppStateService } from './services/state/app-state.service';

export const dialogClose = (dialogResult: any) => '';

export const initializeApp = (appConfig: AppConfig) => () => appConfig.load();

// eslint-disable-next-line @typescript-eslint/naming-convention
export const HttpLoaderFactory = (http: HttpClient) =>
  new TranslateHttpLoader(http, '../../assets/i18n/home/', '.json');

// @ts-ignore
@NgModule({
  declarations: [
    AppComponent,
    NewLandingComponent,
    HomePageComponent,
    DemoVideoComponent,
    UserHomeComponent,
    HomeCreatorPageComponent,
    HomeParticipantPageComponent,
    ImprintComponent,
    DataProtectionComponent,
    CookiesComponent,
    DataProtectionEnComponent,
    DataProtectionDeComponent,
    DataProtectionFrComponent,
    CookiesEnComponent,
    CookiesDeComponent,
    CookiesFrComponent,
    ImprintEnComponent,
    ImprintDeComponent,
    ImprintFrComponent,
    HelpDeComponent,
    HelpEnComponent,
    HelpFrComponent,
    DemoDeComponent,
    DemoEnComponent,
    DemoFrComponent,
    OverlayComponent,
    QuizNowComponent,
    NotifyUnsupportedBrowserComponent,
    AskOnboardingComponent,
    AskOnboardingDEComponent,
    AskOnboardingENComponent,
    AskOnboardingFRComponent,
    UpdateInfoDialogComponent,
  ],
  imports: [
    MatomoModule,
    AppRoutingModule,
    BrowserModule,
    BrowserAnimationsModule,
    EssentialsModule,
    SharedModule,
    ThemeModule,
    MatIconModule,
    MatDialogModule,
    HttpClientModule,
    AdminModule,
    CreatorModule,
    ModeratorModule,
    MarkdownModule.forRoot({
      loader: HttpClient,
      markedOptions: {
        provide: MarkedOptions,
        useValue: {
          pedantic: false,
          gfm: true,
          breaks: true,
          sanitize: false,
          smartLists: true,
          smartypants: true,
          xhtml: false,
        },
      },
    }),
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
    }),
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
      isolate: true,
    }),
    ArsModule,
    TagCloudModule,
    JoyrideModule.forRoot(),
    MatNativeDateModule,
    HighlightModule,
    QuillModule.forRoot(),
    MatRippleModule,
  ],
  providers: [
    /*AppConfig,
    { provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AppConfig], multi: true
    },*/
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthenticationInterceptor,
      multi: true,
    },
    {
      provide: HIGHLIGHT_OPTIONS,
      useValue: HighlightJsDefaults,
    },
    WsConnectorService,
    NotificationService,
    AuthenticationService,
    AuthenticationGuard,
    DataStoreService,
    EventService,
    RoomService,
    CommentService,
    MarkdownService,
    MarkedOptions,
    UserService,
    VoteService,
    ModeratorService,
    BonusTokenService,
    CustomIconService,
    WsConnectorService,
    SpacyService,
    MatBottomSheet,
    DashboardNotificationService,
    {
      provide: MatDialogRef,
      useValue: {
        dialogClose,
      },
    },
    {
      provide: MAT_DIALOG_DATA,
      useValue: [],
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor(
    private appState: AppStateService,
    private translateService: TranslateService,
    private highlightLoader: HighlightLoader,
  ) {
    this.highlightLoader.ready.subscribe();
    this.appState.language$.subscribe((lang) =>
      this.translateService.use(lang),
    );
  }
}
