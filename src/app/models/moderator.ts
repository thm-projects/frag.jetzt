import { ModeratorRole } from './moderator-roles.enum';

export class Moderator {
  userId: string;
  loginId: string;
  roles: ModeratorRole[];

  constructor(
    userId: string = '',
    loginId: string = '',
    roles: ModeratorRole[] = []
  ) {
    this.userId = userId;
    this.loginId = loginId;
    this.roles = roles;
  }
}
