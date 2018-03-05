import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ErrorLandingPageComponent } from './error-landing-page/error-landing-page.component';
// import { GewünschstesModul }  from './blabla/wunschmodul';


const routes: Routes = [
//  { path: '', redirectTo: '/wumod', pathMatch: 'full' }, //default route
//  { path: 'wumod', component: GewünschstesModul },
{ path: 'errorpage', component: ErrorLandingPageComponent }
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
export class AppRoutingModule { }
