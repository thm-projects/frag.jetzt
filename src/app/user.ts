export class User {
  id: number;
  name: string;
  email: string;
  isCreator: boolean;

  constructor(id: number, name: string, email: string, isCreator: boolean) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.isCreator = isCreator;
  }
}
