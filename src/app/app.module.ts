import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RoomJoinComponent } from './components/shared/room-join/room-join.component';
import { LoginComponent } from './components/shared/login/login.component';
import { RegisterComponent } from './components/shared/_dialogs/register/register.component';
import { PasswordResetComponent } from './components/shared/_dialogs/password-reset/password-reset.component';
import { CommentListComponent } from './components/shared/comment-list/comment-list.component';
import { AppRoutingModule } from './app-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PageNotFoundComponent } from './components/shared/page-not-found/page-not-found.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import {
  MAT_DIALOG_DATA,
  MatAutocompleteModule,
  MatBadgeModule,
  MatButtonModule,
  MatButtonToggleModule,
  MatCardModule,
  MatCheckboxModule,
  MatChipsModule,
  MatDatepickerModule,
  MatDialogModule,
  MatDialogRef,
  MatDividerModule,
  MatExpansionModule,
  MatFormFieldModule,
  MatGridListModule,
  MatIconModule,
  MatInputModule,
  MatListModule,
  MatMenuModule,
  MatPaginatorModule,
  MatProgressBarModule,
  MatProgressSpinnerModule,
  MatRadioModule,
  MatSelectModule,
  MatSidenavModule,
  MatSliderModule,
  MatSlideToggleModule,
  MatSnackBarModule,
  MatSortModule,
  MatStepperModule,
  MatTableModule,
  MatTabsModule,
  MatToolbarModule,
  MatTooltipModule
} from '@angular/material';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule } from '@angular/common/http';
import { UserService } from './services/http/user.service';
import { RoomPageComponent } from './components/shared/room-page/room-page.component';
import { RoomCreateComponent } from './components/creator/_dialogs/room-create/room-create.component';
import { LoginPageComponent } from './components/shared/login-page/login-page.component';
import { NotificationService } from './services/util/notification.service';
import { AuthenticationService } from './services/http/authentication.service';
import { AuthenticationGuard } from './guards/authentication.guard';
import { RoomService } from './services/http/room.service';
import { RoomListComponent } from './components/shared/room-list/room-list.component';
import { HomeCreatorPageComponent } from './components/creator/home-creator-page/home-creator-page.component';
import { CommentCreatePageComponent } from './components/creator/comment-create-page/comment-create-page.component';
import { CommentService } from './services/http/comment.service';
import { HomeParticipantPageComponent } from './components/participant/home-participant-page/home-participant-page.component';
import { RoomParticipantPageComponent } from './components/participant/room-participant-page/room-participant-page.component';
import { DataStoreService } from './services/util/data-store.service';
import { RoomCreatorPageComponent } from './components/creator/room-creator-page/room-creator-page.component';
import { ContentListComponent } from './components/shared/content-list/content-list.component';
import { ContentGroupsComponent } from './components/shared/content-groups/content-groups.component';
import { ContentService } from './services/http/content.service';
import { AnswersListComponent } from './components/creator/answers-list/answers-list.component';
import { ContentAnswerService } from './services/http/content-answer.service';
import { RoomDeleteComponent } from './components/creator/_dialogs/room-delete/room-delete.component';
import { StatisticsComponent } from './components/shared/statistics/statistics.component';
import { RoomEditComponent } from './components/creator/_dialogs/room-edit/room-edit.component';
import { UserActivationComponent } from './components/shared/_dialogs/user-activation/user-activation.component';
import { ContentChoiceParticipantComponent } from './components/participant/content-choice-participant/content-choice-participant.component';
import { ContentChoiceCreatorComponent } from './components/creator/content-choice-creator/content-choice-creator.component';
import { ContentCreatePageComponent } from './components/creator/content-create-page/content-create-page.component';
import { ContentCarouselPageComponent } from './components/shared/content-carousel-page/content-carousel-page.component';
import { ContentTextParticipantComponent } from './components/participant/content-text-participant/content-text-participant.component';
import { ContentTextCreatorComponent } from './components/creator/content-text-creator/content-text-creator.component';
import { AuthenticationInterceptor } from './interceptors/authentication.interceptor';
import { HeaderComponent } from './components/shared/header/header.component';
import { ContentLikertCreatorComponent } from './components/creator/content-likert-creator/content-likert-creator.component';
import { ContentYesNoCreatorComponent } from './components/creator/content-yes-no-creator/content-yes-no-creator.component';
import { AnswerEditComponent } from './components/participant/_dialogs/answer-edit/answer-edit.component';
import { ContentDeleteComponent } from './components/creator/_dialogs/content-delete/content-delete.component';
import { FeedbackBarometerPageComponent } from './components/shared/feedback-barometer-page/feedback-barometer-page.component';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { MarkdownModule } from 'ngx-markdown';
import { MarkdownToolbarComponent } from './components/creator/markdown-toolbar/markdown-toolbar.component';
import { MarkdownHelpDialogComponent } from './components/creator/_dialogs/markdown-help-dialog/markdown-help-dialog.component';
import { GenericDataDialogComponent } from './components/shared/_dialogs/generic-data-dialog/generic-data-dialog.component';
import { FooterComponent } from './components/shared/footer/footer.component';
import { FooterLoginDialogComponent } from './components/shared/_dialogs/footer-login-dialog/footer-login-dialog.component';
import { FooterImprintComponent } from './components/shared/footer-imprint/footer-imprint.component';

export function dialogClose(dialogResult: any) {
}

@NgModule({
  declarations: [
    AppComponent,
    RoomJoinComponent,
    AppComponent,
    LoginPageComponent,
    LoginComponent,
    PageNotFoundComponent,
    PasswordResetComponent,
    RegisterComponent,
    RoomPageComponent,
    RegisterComponent,
    RoomCreateComponent,
    RoomListComponent,
    ContentGroupsComponent,
    HomeCreatorPageComponent,
    CommentCreatePageComponent,
    HomeParticipantPageComponent,
    CommentListComponent,
    RoomParticipantPageComponent,
    RoomCreatorPageComponent,
    ContentListComponent,
    AnswersListComponent,
    RoomDeleteComponent,
    RoomEditComponent,
    UserActivationComponent,
    ContentChoiceParticipantComponent,
    ContentChoiceCreatorComponent,
    ContentCreatePageComponent,
    ContentCarouselPageComponent,
    ContentTextParticipantComponent,
    StatisticsComponent,
    ContentTextCreatorComponent,
    HeaderComponent,
    ContentLikertCreatorComponent,
    ContentYesNoCreatorComponent,
    AnswerEditComponent,
    ContentDeleteComponent,
    FeedbackBarometerPageComponent,
    MarkdownToolbarComponent,
    MarkdownHelpDialogComponent,
    GenericDataDialogComponent,
    FooterComponent,
    FooterLoginDialogComponent,
    FooterImprintComponent
  ],
  entryComponents: [
    RegisterComponent,
    PasswordResetComponent,
    RoomCreateComponent,
    RoomDeleteComponent,
    RoomEditComponent,
    UserActivationComponent,
    AnswerEditComponent,
    ContentChoiceCreatorComponent,
    ContentLikertCreatorComponent,
    ContentTextCreatorComponent,
    ContentYesNoCreatorComponent,
    ContentDeleteComponent,
    MarkdownHelpDialogComponent,
    GenericDataDialogComponent,
    FooterLoginDialogComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    BrowserAnimationsModule,
    FlexLayoutModule,
    FormsModule,
    HttpClientModule,
    MarkdownModule.forRoot(),
    MatAutocompleteModule,
    MatBadgeModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDatepickerModule,
    MatDialogModule,
    MatDividerModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatGridListModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSelectModule,
    MatSidenavModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatSortModule,
    MatStepperModule,
    MatTableModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    ReactiveFormsModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthenticationInterceptor,
      multi: true
    },
    NotificationService,
    AuthenticationService,
    AuthenticationGuard,
    DataStoreService,
    RoomService,
    CommentService,
    ContentService,
    ContentAnswerService,
    UserService,
    {
      provide: MatDialogRef,
      useValue: {
        dialogClose
      }
    },
    {
      provide: MAT_DIALOG_DATA,
      useValue: []
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}
