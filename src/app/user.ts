import { AuthProvider } from './auth-provider';
import { UserRole } from './user-roles.enum';

export class User {
  userId: string;
  loginId: string;
  authProvider: AuthProvider;
  token: string;
  userRole: UserRole;

  constructor(userId: string, loginId: string, authProvider: AuthProvider, token: string, userRole: UserRole) {
    this.userId = userId;
    this.loginId = loginId;
    this.authProvider = authProvider;
    this.token = token;
    this.userRole = userRole;
  }
}
