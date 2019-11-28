import { AuthProvider } from './auth-provider';
import { UserRole } from './user-roles.enum';

export class User {
  id: string;
  loginId: string;
  authProvider: string;
  token: string;
  role: UserRole;
  isGuest: boolean;

  constructor(id: string, loginId: string, authProvider: string, token: string, role: UserRole, isGuest: boolean) {
    this.id = id;
    this.loginId = loginId;
    this.authProvider = authProvider;
    this.token = token;
    this.role = role;
    this.isGuest = isGuest;
  }
}
