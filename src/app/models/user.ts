import { UserRole } from './user-roles.enum';

export class User {
  id: string;
  loginId: string;
  type: ('guest' | 'registered');
  token: string;
  role: UserRole;
  isGuest: boolean;

  constructor(id: string, loginId: string, type: ('guest' | 'registered'), token: string, role: UserRole, isGuest: boolean) {
    this.id = id;
    this.loginId = loginId;
    this.type = type;
    this.token = token;
    this.role = role;
    this.isGuest = isGuest;
  }
}
