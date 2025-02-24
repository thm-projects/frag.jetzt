import { FieldsOf, UUID } from 'app/utils/ts-utils';

export enum KeycloakRoles {
  AdminDashboard = 'admin-dashboard',
  AdminAllRoomsOwner = 'admin-all-rooms-owner',
}

export class User {
  id: UUID;
  loginId: string;
  type: 'guest' | 'registered';
  token: string;
  keycloakProviderId: UUID;
  keycloakToken: string;
  keycloakRefreshToken: string;
  isGuest: boolean;
  keycloakRoles: string[];

  constructor({
    id = null,
    loginId = null,
    type = 'guest',
    token = null,
    keycloakProviderId = null,
    keycloakToken = null,
    keycloakRefreshToken = null,
    keycloakRoles = [],
    isGuest = true,
  }: Partial<FieldsOf<User>>) {
    this.id = id;
    this.loginId = loginId;
    this.type = type;
    this.token = token;
    this.keycloakProviderId = keycloakProviderId;
    this.keycloakToken = keycloakToken;
    this.keycloakRefreshToken = keycloakRefreshToken;
    this.keycloakRoles = keycloakRoles;
    this.isGuest = isGuest;
  }

  hasRole(role: KeycloakRoles) {
    return this.keycloakRoles.includes(role);
  }
}
