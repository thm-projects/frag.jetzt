import { UserRole } from '../models/user-roles.enum';

export class RoleChecker {
  static checkRole(url: string, fallback = UserRole.PARTICIPANT): [userRole: UserRole, routeWithRoles: boolean] {
    url = url.toLowerCase();
    if (url.startsWith('/participant/')) {
      return [UserRole.PARTICIPANT, true];
    } else if (url.startsWith('/moderator/')) {
      return [UserRole.EXECUTIVE_MODERATOR, !url.endsWith('/moderator/comments')];
    } else if (url.startsWith('/creator/')) {
      return [UserRole.CREATOR, !url.endsWith('/moderator/comments')];
    }
    return [fallback ?? UserRole.PARTICIPANT, false];
  }
}
