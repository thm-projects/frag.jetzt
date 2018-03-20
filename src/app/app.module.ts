import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { JoinRoomComponent } from './components/fragments/room-join/room-join.component';
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
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { RoomComponent } from './components/pages/room/room.component';
import { RoomCreationComponent } from './components/dialogs/room-create/room-create.component';
import { LoginScreenComponent } from './components/pages/login-screen/login-screen.component';
import { NotificationService } from './services/util/notification.service';
import { AuthenticationService } from './services/http/authentication.service';
import { AuthenticationGuard } from './guards/authentication.guard';
import { RoomService } from './services/http/room.service';
import { RoomListComponent } from './components/fragments/room-list/room-list.component';
import { CreatorHomeScreenComponent } from './components/pages/creator-home-screen/creator-home-screen.component';
import { CreateCommentComponent } from './components/pages/create-comment/create-comment.component';
import { CommentService } from './services/http/comment.service';
import { ParticipantHomeScreenComponent } from './components/pages/participant-home-screen/participant-home-screen.component';
import { ParticipantRoomComponent } from './components/pages/participant-room/participant-room.component';
import { DataStoreService } from './services/util/data-store.service';
import { CreatorRoomComponent } from './components/pages/creator-room/creator-room.component';
import { ContentDetailComponent } from './components/pages/content-detail/content-detail.component';
import { ContentListComponent } from './components/fragments/content-list/content-list.component';
import { ContentService } from './services/http/content.service';
import { ContentAnswersListComponent } from './components/fragments/answers-list/answers-list.component';
import { ContentAnswerService } from './services/http/content-answer.service';
import { RoomDeletionComponent } from './components/dialogs/room-delete/room-delete.component';
import { AnswerStatisticsComponent } from './components/fragments/statistics/statistics.component';
import { RoomModificationComponent } from './components/dialogs/room-edit/room-edit.component';
import { ParticipantChoiceContentComponent } from './components/fragments/participant-choice-content/participant-choice-content.component';
import { CreatorChoiceContentComponent } from './components/fragments/content-choice-creator/content-choice-creator.component';
import { AddContentComponent } from './components/pages/add-content/add-content.component';
import {
  ParticipantContentCarouselPageComponent
} from './components/pages/participant-content-carousel-page/participant-content-carousel-page.component';
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
    RoomComponent,
    RegisterComponent,
    RoomCreationComponent,
    RoomListComponent,
    CreatorHomeScreenComponent,
    CreateCommentComponent,
    ParticipantHomeScreenComponent,
    CommentListComponent,
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
