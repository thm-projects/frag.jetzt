import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
// import { GewünschstesModul }  from './blabla/wunschmodul';


const routes: Routes = [
//  { path: '', redirectTo: '/wumod', pathMatch: 'full' }, //default route
//  { path: 'wumod', component: GewünschstesModul },

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
