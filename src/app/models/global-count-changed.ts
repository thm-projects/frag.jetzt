import { Storable } from 'app/utils/ts-utils';

export class GlobalCountChanged {
  sessionCount: number;
  activeRoomCount: number;
  activeLivepollCount: number;
  participantCount: number;
  moderatorCount: number;
  creatorCount: number;

  constructor({
    sessionCount = 0,
    activeRoomCount = 0,
    activeLivepollCount = 0,
    participantCount = 0,
    moderatorCount = 0,
    creatorCount = 0,
  }: Storable<GlobalCountChanged>) {
    this.sessionCount = sessionCount;
    this.activeRoomCount = activeRoomCount;
    this.activeLivepollCount = activeLivepollCount;
    this.participantCount = participantCount;
    this.moderatorCount = moderatorCount;
    this.creatorCount = creatorCount;
  }
}
