import { RoomService } from '../services/http/room.service';

/* eslint-disable @typescript-eslint/naming-convention */
export enum RoomAccessRole {
  PARTICIPANT = 'PARTICIPANT',
  EDITING_MODERATOR = 'EDITING_MODERATOR',
  EXECUTIVE_MODERATOR = 'EXECUTIVE_MODERATOR'
}

/* eslint-enable @typescript-eslint/naming-convention */

export interface RoomAccess {
  id: string;
  roomId: string;
  accountId: string;
  role: RoomAccessRole;
  lastVisit: Date;
}

export class ClientAuthentication {
  accountId: string;
  authenticated: boolean;
  authorities: any[];
  credentials: string;
  details: string;
  name: string;
  principal: string;
  roomAccesses: RoomService[];
  type: ('guest' | 'registered');

  constructor(accountId: string = null,
              authenticated: boolean = true,
              authorities: any[] = [],
              credentials: string = null,
              details: string = null,
              name: string = null,
              principal: string = null,
              roomAccesses: RoomService[] = [],
              type: ('guest' | 'registered') = null) {
    this.accountId = accountId;
    this.authenticated = authenticated;
    this.authorities = authorities;
    this.credentials = credentials;
    this.details = details;
    this.name = name;
    this.principal = principal;
    this.roomAccesses = roomAccesses;
    this.type = type;
  }

}
