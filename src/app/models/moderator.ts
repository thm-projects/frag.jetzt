import { ModeratorRole } from './moderator-roles.enum';

export class Moderator {
  userId: string;
  roles: ModeratorRole[];

  constructor(
    userId: string = '',
    roles: ModeratorRole[] = []
  ) {
    this.userId = userId;
    this.roles = roles;
  }
}
