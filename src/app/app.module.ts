import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { JoinRoomComponent } from './join-room/join-room.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { PasswordResetComponent } from './password-reset/password-reset.component';
import { CommentComponent } from './comment/comment.component';

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
import { ParticipantHomeScreenComponent } from './participant-home-screen/participant-home-screen.component';

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
    CommentComponent
  ],
  entryComponents: [
    RegisterComponent,
    PasswordResetComponent
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
    MatTooltipModule,
    HttpClientModule,
    HttpClientInMemoryWebApiModule.forRoot(
      InMemoryDataService, { dataEncapsulation: false }
    )
  ],
  providers: [
    NotificationService,
    AuthenticationService,
    AuthenticationGuard,
    RoomService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
