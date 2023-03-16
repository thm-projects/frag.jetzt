import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PageNotFoundComponent } from './components/shared/page-not-found/page-not-found.component';
import { HomePageComponent } from './components/home/home-page/home-page.component';
import { UserHomeComponent } from './components/home/user-home/user-home.component';
import { ImprintComponent } from './components/home/_dialogs/imprint/imprint.component';
import { DataProtectionComponent } from './components/home/_dialogs/data-protection/data-protection.component';
import { QuizNowComponent } from './components/shared/quiz-now/quiz-now.component';
import { DemoVideoComponent } from './components/home/_dialogs/demo-video/demo-video.component';
import { ChatGPTPromptPresetComponent } from './components/shared/chat-gptprompt-preset/chat-gptprompt-preset.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    component: HomePageComponent,
  },
  {
    path: 'user',
    component: UserHomeComponent,
  },
  {
    path: 'imprint',
    component: ImprintComponent,
  },
  {
    path: 'introduction',
    component: DemoVideoComponent,
  },
  {
    path: 'data-protection',
    component: DataProtectionComponent,
  },
  {
    path: 'quiz',
    component: QuizNowComponent,
  },
  {
    path: 'gpt-prompts',
    component: ChatGPTPromptPresetComponent,
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./components/admin/admin.module').then((m) => m.AdminModule),
  },
  {
    path: 'creator',
    loadChildren: () =>
      import('./components/creator/creator.module').then(
        (m) => m.CreatorModule,
      ),
  },
  {
    path: 'participant',
    loadChildren: () =>
      import('./components/participant/participant.module').then(
        (m) => m.ParticipantModule,
      ),
  },
  {
    path: 'moderator',
    loadChildren: () =>
      import('./components/moderator/moderator.module').then(
        (m) => m.ModeratorModule,
      ),
  },
  {
    path: '**',
    component: PageNotFoundComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
