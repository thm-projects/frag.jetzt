export class Moderator {
  userId: string;
  loginId: string;

  constructor(
    userId: string = '',
    loginId: string = ''
  ) {
    this.userId = userId;
    this.loginId = loginId;
  }
}
