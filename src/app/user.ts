import { UserRole } from './user-roles.enum';

export class User {
  id: number;
  name: string;
  email: string;
  role: UserRole;

  constructor(id: number, name: string, email: string, role: UserRole) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.role = role;
  }
}
