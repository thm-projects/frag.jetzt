import { RouterModule, Routes } from '@angular/router';
import { AuthenticationGuard } from '../../guards/authentication.guard';
import { NgModule } from '@angular/core';
import { CreateMotdComponent } from './create-motd/create-motd.component';
import { AdminOverviewComponent } from './admin-overview/admin-overview.component';
import { AdminMailingComponent } from './admin-mailing/admin-mailing.component';
import { KeycloakProviderComponent } from './keycloak-provider/keycloak-provider.component';
import { APISetupComponent } from 'app/user/apisetup/apisetup.component';

const routes: Routes = [
  {
    path: 'overview',
    component: AdminOverviewComponent,
    canActivate: [AuthenticationGuard],
    data: { superAdmin: true },
    title: 'ADMIN_OVERVIEW',
  },
  {
    path: 'create-motd',
    component: CreateMotdComponent,
    canActivate: [AuthenticationGuard],
    data: { superAdmin: true },
    title: 'ADMIN_CREATE_MOTD',
  },
  {
    path: 'mailing',
    component: AdminMailingComponent,
    canActivate: [AuthenticationGuard],
    data: { superAdmin: true },
    title: 'ADMIN_MAILING',
  },
  {
    path: 'keycloak-provider',
    component: KeycloakProviderComponent,
    canActivate: [AuthenticationGuard],
    data: { superAdmin: true },
    title: 'ADMIN_KEYCLOAK_PROVIDER',
  },
  {
    path: 'api-setup',
    component: APISetupComponent,
    title: 'API_SETUP',
    data: {
      mode: 'admin',
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
