import { FieldsOf } from 'app/utils/ts-utils';

/* eslint-disable @typescript-eslint/naming-convention */
export enum RoomAccessRole {
  PARTICIPANT = 'PARTICIPANT',
  EDITING_MODERATOR = 'EDITING_MODERATOR',
  EXECUTIVE_MODERATOR = 'EXECUTIVE_MODERATOR',
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
  authorities: unknown[];
  credentials: string;
  details: string;
  name: string;
  principal: string;
  roomAccesses: RoomAccess[];
  type: 'guest' | 'registered';

  constructor({
    accountId = null,
    authenticated = true,
    authorities = [],
    credentials = null,
    details = null,
    name = null,
    principal = null,
    roomAccesses = [],
    type = null,
  }: FieldsOf<ClientAuthentication>) {
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
