import { Room } from './room';
import { UserRole } from './user-roles.enum';

export class RoomRoleMixin extends Room {
  role: UserRole;
  commentCount: number;
}
