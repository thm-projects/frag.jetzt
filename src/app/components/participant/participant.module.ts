import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParticipantRoutingModule } from './participant-routing.module';
import { EssentialsModule } from '../essentials/essentials.module';
import { ContentChoiceParticipantComponent } from './content-choice-participant/content-choice-participant.component';
import { ContentTextParticipantComponent } from './content-text-participant/content-text-participant.component';
import { HomeParticipantPageComponent } from './home-participant-page/home-participant-page.component';
import { RoomParticipantPageComponent } from './room-participant-page/room-participant-page.component';
import { SharedModule } from '../shared/shared.module';
import { ParticipantContentCarouselPageComponent } from './participant-content-carousel-page/participant-content-carousel-page.component';

@NgModule({
  imports: [
    CommonModule,
    ParticipantRoutingModule,
    EssentialsModule,
    SharedModule
  ],
  declarations: [
    ContentChoiceParticipantComponent,
    ContentTextParticipantComponent,
    HomeParticipantPageComponent,
    RoomParticipantPageComponent,
    ParticipantContentCarouselPageComponent
  ]
})
export class ParticipantModule { }
