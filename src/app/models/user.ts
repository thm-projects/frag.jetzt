import { FieldsOf, UUID } from 'app/utils/ts-utils';
import { UserRole } from './user-roles.enum';

export enum KeycloakRoles {
  AdminDashboard = 'admin-dashboard',
  AdminAllRoomsOwner = 'admin-all-rooms-owner',
}

export class User {
  id: UUID;
  loginId: string;
  type: 'guest' | 'registered';
  token: string;
  keycloakToken: string;
  keycloakRefreshToken: string;
  role: UserRole;
  isGuest: boolean;
  keycloakRoles: string[];

  constructor({
    id = null,
    loginId = null,
    type = 'guest',
    token = null,
    keycloakToken = null,
    keycloakRefreshToken = null,
    keycloakRoles = [],
    role = UserRole.PARTICIPANT,
    isGuest = true,
  }: Partial<FieldsOf<User>>) {
    this.id = id;
    this.loginId = loginId;
    this.type = type;
    this.token = token;
    this.keycloakToken = keycloakToken;
    this.keycloakRefreshToken = keycloakRefreshToken;
    this.keycloakRoles = keycloakRoles;
    this.role = role;
    this.isGuest = isGuest;
  }

  hasRole(role: KeycloakRoles) {
    return this.keycloakRoles.includes(role);
  }
}
