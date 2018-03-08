import { UserRole } from './user-roles.enum';

export class User {
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
