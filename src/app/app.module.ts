import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { JoinRoomComponent } from './join-room/join-room.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { PasswordResetComponent } from './password-reset/password-reset.component';
import { CommentListComponent } from './comment-list/comment-list.component';

import { AppRoutingModule } from './app-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
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
import { HttpClientInMemoryWebApiModule } from 'angular-in-memory-web-api';
import { HttpClientModule } from '@angular/common/http';
import { InMemoryDataService } from './in-memory-data.service';
import { RoomComponent } from './room/room.component';
import { RoomCreationComponent } from './room-creation/room-creation.component';
import { LoginScreenComponent } from './login-screen/login-screen.component';
import { NotificationService } from './notification.service';
import { AuthenticationService } from './authentication.service';
import { AuthenticationGuard } from './authentication.guard';
import { ContentCreationComponent } from './content-creation/content-creation.component';
import { RoomService } from './room.service';
import { RoomListComponent } from './room-list/room-list.component';
import { CreatorHomeScreenComponent } from './creator-home-screen/creator-home-screen.component';
import { CreateCommentComponent } from './create-comment/create-comment.component';
import { CommentService } from './comment.service';
import { ParticipantHomeScreenComponent } from './participant-home-screen/participant-home-screen.component';
import { ParticipantRoomComponent } from './participant-room/participant-room.component';
import { DataStoreService } from './data-store.service';
import { CreatorRoomComponent } from './creator-room/creator-room.component';
import { ContentDetailComponent } from './content-detail/content-detail.component';
import { ContentListComponent } from './content-list/content-list.component';
import { ContentService } from './content.service';
import { ContentAnswersListComponent } from './content-answers-list/content-answers-list.component';
import { ContentAnswerService } from './content-answer.service';
import { RoomDeletionComponent } from './room-deletion/room-deletion.component';
import { RoomModificationComponent } from './room-modification/room-modification.component';

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
    RoomModificationComponent
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
    HttpClientModule,
    HttpClientInMemoryWebApiModule.forRoot(
      InMemoryDataService, { dataEncapsulation: false }
    )
  ],
  providers: [
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
