import { AuthProvider } from './auth-provider';
import { UserRole } from './user-roles.enum';

export class User {
  id: string;
  loginId: string;
  authProvider: AuthProvider;
  token: string;
  role: UserRole;

  constructor(id: string, loginId: string, authProvider: AuthProvider, token: string, role: UserRole) {
    this.id = id;
    this.loginId = loginId;
    this.authProvider = authProvider;
    this.token = token;
    this.role = role;
  }
}
