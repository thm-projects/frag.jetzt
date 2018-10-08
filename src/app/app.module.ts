import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RoomJoinComponent } from './components/fragments/room-join/room-join.component';
import { LoginComponent } from './components/fragments/login/login.component';
import { RegisterComponent } from './components/dialogs/register/register.component';
import { PasswordResetComponent } from './components/dialogs/password-reset/password-reset.component';
import { CommentListComponent } from './components/fragments/comment-list/comment-list.component';
import { AppRoutingModule } from './app-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PageNotFoundComponent } from './components/pages/page-not-found/page-not-found.component';
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
import { RoomPageComponent } from './components/pages/room-page/room-page.component';
import { RoomCreateComponent } from './components/dialogs/room-create/room-create.component';
import { LoginComponentPageComponent } from './components/pages/login-page/login-page.component';
import { NotificationService } from './services/util/notification.service';
import { AuthenticationService } from './services/http/authentication.service';
import { AuthenticationGuard } from './guards/authentication.guard';
import { RoomService } from './services/http/room.service';
import { RoomListComponent } from './components/fragments/room-list/room-list.component';
import { HomeCreatorPageComponent } from './components/pages/home-creator-page/home-creator-page.component';
import { CommentCreatePageComponent } from './components/pages/comment-create-page/comment-create-page.component';
import { CommentService } from './services/http/comment.service';
import { HomeParticipantPageComponent } from './components/pages/home-participant-page/home-participant-page.component';
import { RoomParticipantPageComponent } from './components/pages/room-participant-page/room-participant-page.component';
import { DataStoreService } from './services/util/data-store.service';
import { RoomCreatorPageComponent } from './components/pages/room-creator-page/room-creator-page.component';
import { ContentListComponent } from './components/fragments/content-list/content-list.component';
import { ContentGroupsComponent } from './components/fragments/content-groups/content-groups.component';
import { ContentService } from './services/http/content.service';
import { AnswersListComponent } from './components/fragments/answers-list/answers-list.component';
import { ContentAnswerService } from './services/http/content-answer.service';
import { RoomDeleteComponent } from './components/dialogs/room-delete/room-delete.component';
import { StatisticsComponent } from './components/fragments/statistics/statistics.component';
import { RoomEditComponent } from './components/dialogs/room-edit/room-edit.component';
import { UserActivationComponent } from './components/dialogs/user-activation/user-activation.component';
import { ContentChoiceParticipantComponent } from './components/fragments/content-choice-participant/content-choice-participant.component';
import { ContentChoiceCreatorComponent } from './components/fragments/content-choice-creator/content-choice-creator.component';
import { ContentCreatePageComponent } from './components/pages/content-create-page/content-create-page.component';
import { ContentCarouselPageComponent } from './components/pages/content-carousel-page/content-carousel-page.component';
import { ContentTextParticipantComponent } from './components/fragments/content-text-participant/content-text-participant.component';
import { ContentTextCreatorComponent } from './components/fragments/content-text-creator/content-text-creator.component';
import { AuthenticationInterceptor } from './interceptors/authentication.interceptor';
import { HeaderComponent } from './components/fragments/header/header.component';
import { ContentLikertCreatorComponent } from './components/fragments/content-likert-creator/content-likert-creator.component';
import { ContentYesNoCreatorComponent } from './components/fragments/content-yes-no-creator/content-yes-no-creator.component';
import { AnswerEditComponent } from './components/dialogs/answer-edit/answer-edit.component';
import { ContentDeleteComponent } from './components/dialogs/content-delete/content-delete.component';
import { FeedbackBarometerPageComponent } from './components/pages/feedback-barometer-page/feedback-barometer-page.component';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { MarkdownModule } from 'ngx-markdown';
import { MarkdownToolbarComponent } from './components/fragments/markdown-toolbar/markdown-toolbar.component';
import { MarkdownHelpDialogComponent } from './components/dialogs/markdown-help-dialog/markdown-help-dialog.component';
import { GenericDataDialogComponent } from './components/dialogs/generic-data-dialog/generic-data-dialog.component';
import { FooterComponent } from './components/fragments/footer/footer.component';
import { FooterLoginDialogComponent } from './components/dialogs/footer-login-dialog/footer-login-dialog.component';
import { FooterImprintComponent } from './components/pages/footer-imprint/footer-imprint.component';
import { CollectionSelectComponent } from './components/dialogs/collection-select/collection-select.component';

export function dialogClose(dialogResult: any) {
}

@NgModule({
  declarations: [
    AppComponent,
    RoomJoinComponent,
    AppComponent,
    LoginComponentPageComponent,
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
    FooterImprintComponent,
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
