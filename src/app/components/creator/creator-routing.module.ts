import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthenticationGuard } from '../../guards/authentication.guard';
import { UserRole } from '../../models/user-roles.enum';
import { RoomCreatorPageComponent } from './room-creator-page/room-creator-page.component';
import { ContentCreatePageComponent } from './content-create-page/content-create-page.component';
import { StatisticsPageComponent } from '../shared/statistics-page/statistics-page.component';
import { FeedbackBarometerPageComponent } from '../shared/feedback-barometer-page/feedback-barometer-page.component';
import { ContentListComponent } from './content-list/content-list.component';
import { StatisticComponent } from '../shared/statistic/statistic.component';
import { ContentPresentationComponent } from './content-presentation/content-presentation.component';
import { CommentPageComponent } from '../shared/comment-page/comment-page.component';

const routes: Routes = [
  {
    path: 'room/:roomId',
    component: RoomCreatorPageComponent,
    data: { roles: [UserRole.CREATOR] }
  },
  {
    path: 'room/:roomId/create-content',
    component: ContentCreatePageComponent,
    canActivate: [AuthenticationGuard],
  },
  {
    path: 'room/:roomId/statistics',
    component: StatisticsPageComponent,
    canActivate: [AuthenticationGuard],
  },
  {
    path: 'room/:roomId/statistics/:contentId',
    component: StatisticComponent,
    data: { roles: [UserRole.CREATOR] }
  },
  {
    path: 'room/:roomId/comments',
    component: CommentPageComponent,
    data: { roles: [UserRole.CREATOR] }
  },
  {
    path: 'room/:roomId/feedback-barometer',
    component: FeedbackBarometerPageComponent,
    data: { roles: [UserRole.CREATOR] }
  },
  {
    path: 'room/:roomId/:contentGroup',
    component: ContentListComponent,
    data: { roles: [UserRole.CREATOR] }
  },
  {
    path: 'room/:roomId/:contentGroup/presentation',
    component: ContentPresentationComponent,
    data: { roles: [UserRole.CREATOR] }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class CreatorRoutingModule {
}
