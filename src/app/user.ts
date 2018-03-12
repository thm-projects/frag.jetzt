import { UserRole } from './user-roles.enum';

export class User {
  // ToDo: Remove id since it is replaced by JWT token
  id: number;
  name: string;
  email: string;
  role: UserRole;
  token: string;

  constructor(id: number, name: string, email: string, role: UserRole, token: string) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.role = role;
    this.token = token;
  }
}
