import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { LoginScreenComponent } from './login-screen/login-screen.component';
import { RoomComponent } from './room/room.component';
import { CreatorHomeScreenComponent } from './creator-home-screen/creator-home-screen.component';
import { ParticipantHomeScreenComponent } from './participant-home-screen/participant-home-screen.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: LoginScreenComponent },
  { path: 'creator', component: CreatorHomeScreenComponent },
  { path: 'room/:roomId', component: RoomComponent },
  { path: 'participant', component: ParticipantHomeScreenComponent },
  { path: '**', component: PageNotFoundComponent }
];


@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [
    RouterModule
  ],
  declarations: []
})
export class AppRoutingModule {
}
