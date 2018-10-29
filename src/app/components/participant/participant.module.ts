import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParticipantRoutingModule } from './participant-routing.module';
import { ContentChoiceParticipantComponent } from './content-choice-participant/content-choice-participant.component';
import { ContentTextParticipantComponent } from './content-text-participant/content-text-participant.component';
import { HomeParticipantPageComponent } from './home-participant-page/home-participant-page.component';
import { RoomParticipantPageComponent } from './room-participant-page/room-participant-page.component';

@NgModule({
  imports: [
    CommonModule,
    ParticipantRoutingModule
  ],
  declarations: [
    ContentChoiceParticipantComponent,
    ContentTextParticipantComponent,
    HomeParticipantPageComponent,
    RoomParticipantPageComponent
  ]
})
export class ParticipantModule{
}
