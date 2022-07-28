import { RouterModule, Routes } from '@angular/router';
import { AuthenticationGuard } from '../../guards/authentication.guard';
import { NgModule } from '@angular/core';
import { CreateMotdComponent } from './create-motd/create-motd.component';

const routes: Routes = [
  {
    path: 'create-motd',
    component: CreateMotdComponent,
    canActivate: [AuthenticationGuard],
    data: { superAdmin: true }
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule {
}
