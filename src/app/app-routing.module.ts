import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ErrorLandingPageComponent } from './error-landing-page/error-landing-page.component';


const routes: Routes = [
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
