import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { LoginScreenComponent } from './login-screen/login-screen.component';
import { RoomComponent } from './room/room.component';

const routes: Routes = [
  { path: 'home', component: LoginScreenComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'room/:roomId', component: RoomComponent },
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
