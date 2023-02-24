import { RouterModule, Routes } from '@angular/router';
import { AuthenticationGuard } from '../../guards/authentication.guard';
import { NgModule } from '@angular/core';
import { CreateMotdComponent } from './create-motd/create-motd.component';
import { GptConfigurationComponent } from './gpt-configuration/gpt-configuration.component';
import { AdminOverviewComponent } from './admin-overview/admin-overview.component';
import { GptChatComponent } from '../shared/gpt-chat/gpt-chat.component';

const routes: Routes = [
  {
    path: 'overview',
    component: AdminOverviewComponent,
    canActivate: [AuthenticationGuard],
    data: { superAdmin: true }
  },
  {
    path: 'create-motd',
    component: CreateMotdComponent,
    canActivate: [AuthenticationGuard],
    data: { superAdmin: true }
  },
  {
    path: 'gpt-config',
    component: GptConfigurationComponent,
    canActivate: [AuthenticationGuard],
    data: { superAdmin: true }
  },
  {
    path: 'gpt-chat',
    component: GptChatComponent,
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
