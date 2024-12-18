import { Injector, NgModule, isDevMode } from '@angular/core';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
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
import { AuthenticationInterceptor } from './interceptors/authentication.interceptor';
import { EssentialsModule } from './components/essentials/essentials.module';
import { SharedModule } from './components/shared/shared.module';
import { CreatorModule } from './components/creator/creator.module';
import { BrowserModule, DomSanitizer } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NewLandingComponent } from './components/home/new-landing/new-landing.component';
import { HomePageComponent } from './components/home/home-page/home-page.component';
import { UserHomePageComponent } from './components/home/user-home-page/user-home-page.component';
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
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
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
import { AskOnboardingComponent } from './components/home/_dialogs/ask-onboarding/ask-onboarding.component';
import { AskOnboardingDEComponent } from 'assets/i18n/components/ask-onboarding/ask-onboarding-de.component';
import { AskOnboardingENComponent } from 'assets/i18n/components/ask-onboarding/ask-onboarding-en.component';
import { AskOnboardingFRComponent } from 'assets/i18n/components/ask-onboarding/ask-onboarding-fr.component';
import { AppStateService } from './services/state/app-state.service';
import { DownloadComponent } from './components/home/_dialogs/download/download.component';
import {
  MAT_DIALOG_DEFAULT_OPTIONS,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { ColorPickerModule } from 'ngx-color-picker';
import { FragJetztLogoComponent } from './components/branding/frag-jetzt-logo/frag-jetzt-logo.component';
import { M3Module } from '../modules/m3/m3.module';
import { M3BodyPaneComponent } from '../modules/m3/components/layout/m3-body-pane/m3-body-pane.component';
import { M3SupportingPaneComponent } from '../modules/m3/components/layout/m3-supporting-pane/m3-supporting-pane.component';
import { ComponentTestCardComponent } from './components/shared/component-test/component-test-page/component-test-card/component-test-card.component';
import { ComponentTestButtonComponent } from './components/shared/component-test/component-test-page/component-test-button/component-test-button.component';
import { M3NavigationComponent } from 'modules/navigation/m3-navigation/m3-navigation.component';
import { YtVideoWrapperComponent } from './components/home/home-page/yt-video-wrapper/yt-video-wrapper.component';
import { FeatureGridComponent } from './components/home/home-page/feature-grid/feature-grid.component';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { angularInjector } from './base/angular-init';
import { PaymentRouteComponent } from './paypal/payment-route/payment-route.component';
import { ExcuseComponent } from './components/home/_dialogs/excuse/excuse.component';
import { FirstTimeUserComponent } from './components/home/_dialogs/first-time-user/first-time-user.component';
import './base/theme/apply-system-variables';
import { PwaInstallSnackbarComponent } from './components/shared/pwa-install-snackbar/pwa-install-snackbar.component';

export const HttpLoaderFactory = (http: HttpClient) =>
  new TranslateHttpLoader(http, '../../assets/i18n/home/', '.json');

@NgModule({
  declarations: [
    AppComponent,
    NewLandingComponent,
    HomePageComponent,
    FirstTimeUserComponent,
    DemoVideoComponent,
    UserHomePageComponent,
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
    DownloadComponent,
    ExcuseComponent,
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    BrowserAnimationsModule,
    EssentialsModule,
    M3Module,
    M3NavigationComponent,
    SharedModule,
    MatIconModule,
    MatDialogModule,
    HttpClientModule,
    AdminModule,
    CreatorModule,
    ModeratorModule,
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
    JoyrideModule.forRoot(),
    MatNativeDateModule,
    MatRippleModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000',
    }),
    ColorPickerModule,
    FragJetztLogoComponent,
    M3BodyPaneComponent,
    M3SupportingPaneComponent,
    ComponentTestCardComponent,
    ComponentTestButtonComponent,
    YtVideoWrapperComponent,
    FeatureGridComponent,
    CdkDrag,
    PaymentRouteComponent,
    PwaInstallSnackbarComponent,
  ],
  providers: [
    /*AppConfig,
    { provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AppConfig], multi: true
    },*/
    {
      provide: MAT_DIALOG_DEFAULT_OPTIONS,
      useValue: {
        autoFocus: false,
        maxHeight: 'calc(var(--mat-dialog-container-max-height, 100dvh - 2em))',
      },
    },
    {
      provide: MatDialogRef,
      useValue: {},
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthenticationInterceptor,
      multi: true,
    },
    NotificationService,
    AuthenticationService,
    AuthenticationGuard,
    DataStoreService,
    EventService,
    RoomService,
    CommentService,
    UserService,
    VoteService,
    ModeratorService,
    BonusTokenService,
    CustomIconService,
    SpacyService,
    MatBottomSheet,
    DashboardNotificationService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor(
    private appState: AppStateService,
    private translateService: TranslateService,
    iconRegistry: MatIconRegistry,
    domSanitizer: DomSanitizer,
    injector: Injector,
  ) {
    angularInjector.next(injector);
    this.appState.language$.subscribe((lang) =>
      this.translateService.use(lang),
    );
    iconRegistry
      .addSvgIcon(
        'fj_robot',
        domSanitizer.bypassSecurityTrustResourceUrl(
          'assets/images/chat_bot.svg',
        ),
      )
      .addSvgIcon(
        'fj_beamer',
        domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/beamer.svg'),
      )
      .addSvgIcon(
        'fj_radar',
        domSanitizer.bypassSecurityTrustResourceUrl(
          'assets/images/radar_clean.svg',
        ),
      )
      .setDefaultFontSetClass('material-symbols-rounded');
  }
}
