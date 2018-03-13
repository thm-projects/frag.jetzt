import { AuthProvider } from './auth-provider';

export class User {
  userId: string;
  loginId: string;
  authProvider: AuthProvider;
  token: string;
}
