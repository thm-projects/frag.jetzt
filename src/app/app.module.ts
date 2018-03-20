import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { JoinRoomComponent } from './components/fragments/join-room/join-room.component';
import { LoginComponent } from './components/fragments/login/login.component';
import { RegisterComponent } from './components/dialogs/register/register.component';
import { PasswordResetComponent } from './components/dialogs/password-reset/password-reset.component';
import { CommentListComponent } from './components/fragments/comment-list/comment-list.component';

import { AppRoutingModule } from './app-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PageNotFoundComponent } from './components/pages/page-not-found/page-not-found.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import {
  MatAutocompleteModule,
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
  MatTooltipModule
} from '@angular/material';
import { ContentAnswersComponent } from './content-answers/content-answers.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { RoomComponent } from './components/pages/room/room.component';
import { RoomCreationComponent } from './components/dialogs/room-creation/room-creation.component';
import { LoginScreenComponent } from './components/pages/login-screen/login-screen.component';
import { NotificationService } from './notification.service';
import { AuthenticationService } from './authentication.service';
import { AuthenticationGuard } from './guards/authentication.guard';
import { ContentCreationComponent } from './content-creation/content-creation.component';
import { RoomService } from './room.service';
import { RoomListComponent } from './components/fragments/room-list/room-list.component';
import { CreatorHomeScreenComponent } from './components/pages/creator-home-screen/creator-home-screen.component';
import { CreateCommentComponent } from './components/pages/create-comment/create-comment.component';
import { CommentService } from './comment.service';
import { ParticipantHomeScreenComponent } from './components/pages/participant-home-screen/participant-home-screen.component';
import { ParticipantRoomComponent } from './components/pages/participant-room/participant-room.component';
import { DataStoreService } from './data-store.service';
import { CreatorRoomComponent } from './components/pages/creator-room/creator-room.component';
import { ContentDetailComponent } from './components/pages/content-detail/content-detail.component';
import { ContentListComponent } from './components/fragments/content-list/content-list.component';
import { ContentService } from './content.service';
import { ContentAnswersListComponent } from './components/fragments/content-answers-list/content-answers-list.component';
import { ContentAnswerService } from './content-answer.service';
import { RoomDeletionComponent } from './components/dialogs/room-deletion/room-deletion.component';
import { AnswerStatisticsComponent } from './components/fragments/answer-statistics/answer-statistics.component';
import { RoomModificationComponent } from './components/dialogs/room-modification/room-modification.component';
import { ParticipantChoiceContentComponent } from './components/fragments/participant-choice-content/participant-choice-content.component';
import { CreatorChoiceContentComponent } from './components/fragments/creator-choice-content/creator-choice-content.component';
import { AddContentComponent } from './components/pages/add-content/add-content.component';
import { ParticipantContentCarouselPageComponent } from './components/pages/participant-content-carousel-page/participant-content-carousel-page.component';
import { ParticipantTextContentComponent } from './components/fragments/participant-text-content/participant-text-content.component';
import { CreatorTextContentComponent } from './components/fragments/creator-text-content/creator-text-content.component';
import { AuthenticationInterceptor } from './interceptors/authentication.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    JoinRoomComponent,
    AppComponent,
    LoginComponent,
    LoginScreenComponent,
    PageNotFoundComponent,
    PasswordResetComponent,
    RegisterComponent,
    ContentCreationComponent,
    RoomComponent,
    RegisterComponent,
    RoomCreationComponent,
    RoomListComponent,
    CreatorHomeScreenComponent,
    CreateCommentComponent,
    ParticipantHomeScreenComponent,
    CommentListComponent,
    ContentAnswersComponent,
    ParticipantRoomComponent,
    CreatorRoomComponent,
    ContentDetailComponent,
    ContentListComponent,
    ContentAnswersListComponent,
    RoomDeletionComponent,
    RoomModificationComponent,
    ParticipantChoiceContentComponent,
    CreatorChoiceContentComponent,
    AddContentComponent,
    ParticipantContentCarouselPageComponent,
    ParticipantTextContentComponent,
    AnswerStatisticsComponent,
    CreatorTextContentComponent
  ],
  entryComponents: [
    RegisterComponent,
    PasswordResetComponent,
    RoomCreationComponent,
    RoomDeletionComponent,
    RoomModificationComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    BrowserAnimationsModule,
    FlexLayoutModule,
    FormsModule,
    MatAutocompleteModule,
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
    HttpClientModule
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
    ContentAnswerService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
