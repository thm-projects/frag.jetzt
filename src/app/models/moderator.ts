import { ModeratorRole } from './moderator-roles.enum';
import { UserRole } from './user-roles.enum';

export class Moderator {
  userId: string;
  loginId: string;
  roles: UserRole[];

  constructor(
    userId: string = '',
    loginId: string = '',
    roles: UserRole[] = []
  ) {
    this.userId = userId;
    this.loginId = loginId;
    this.roles = roles;
  }
}
