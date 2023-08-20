import { RouterModule, Routes } from '@angular/router';
import { AuthenticationGuard } from '../../guards/authentication.guard';
import { NgModule } from '@angular/core';
import { CreateMotdComponent } from './create-motd/create-motd.component';
import { GptConfigurationComponent } from './gpt-configuration/gpt-configuration.component';
import { AdminOverviewComponent } from './admin-overview/admin-overview.component';
import { GptChatComponent } from './gpt-chat/gpt-chat.component';
import { ChatGPTPromptPresetComponent } from '../shared/chat-gptprompt-preset/chat-gptprompt-preset.component';
import { AdminMailingComponent } from './admin-mailing/admin-mailing.component';
import { KeycloakProviderComponent } from './keycloak-provider/keycloak-provider.component';

const routes: Routes = [
  {
    path: 'overview',
    component: AdminOverviewComponent,
    canActivate: [AuthenticationGuard],
    data: { superAdmin: true },
  },
  {
    path: 'create-motd',
    component: CreateMotdComponent,
    canActivate: [AuthenticationGuard],
    data: { superAdmin: true },
  },
  {
    path: 'gpt-config',
    component: GptConfigurationComponent,
    canActivate: [AuthenticationGuard],
    data: { superAdmin: true },
  },
  {
    path: 'gpt-chat',
    component: GptChatComponent,
    canActivate: [AuthenticationGuard],
    data: { superAdmin: true },
  },
  {
    path: 'gpt-prompts',
    component: ChatGPTPromptPresetComponent,
    canActivate: [AuthenticationGuard],
    data: { superAdmin: true },
  },
  {
    path: 'mailing',
    component: AdminMailingComponent,
    canActivate: [AuthenticationGuard],
    data: { superAdmin: true },
  },
  {
    path: 'keycloak-provider',
    component: KeycloakProviderComponent,
    canActivate: [AuthenticationGuard],
    data: { superAdmin: true },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
