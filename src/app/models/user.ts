import { UUID } from 'app/utils/ts-utils';
import { UserRole } from './user-roles.enum';

export class User {
  id: UUID;
  loginId: string;
  type: 'guest' | 'registered';
  token: string;
  keycloakToken: string;
  keycloakRefreshToken: string;
  role: UserRole;
  isGuest: boolean;

  constructor({
    id = null,
    loginId = null,
    type = 'guest',
    token = null,
    keycloakToken = null,
    keycloakRefreshToken = null,
    role = UserRole.PARTICIPANT,
    isGuest = true,
  }: Partial<User>) {
    this.id = id;
    this.loginId = loginId;
    this.type = type;
    this.token = token;
    this.keycloakToken = keycloakToken;
    this.keycloakRefreshToken = keycloakRefreshToken;
    this.role = role;
    this.isGuest = isGuest;
  }
}
