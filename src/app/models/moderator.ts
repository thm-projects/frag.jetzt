import { UserRole } from './user-roles.enum';

export class Moderator {
  accountId: string;
  roomId: string;
  loginId: string;
  role: UserRole;

  constructor(
    accountId: string = '',
    roomId: string = '',
    loginId: string = '',
    role: UserRole = UserRole.PARTICIPANT
  ) {
    this.accountId = accountId;
    this.roomId = roomId;
    this.loginId = loginId;
    this.role = role;
  }
}
