import { Component, OnInit, Input } from '@angular/core';
import { Room } from '../../../models/room';
import { RoomRoleMixin } from '../../../models/room-role-mixin';
import { User } from '../../../models/user';
import { UserRole } from '../../../models/user-roles.enum';
import { Moderator } from '../../../models/moderator';
import { RoomService } from '../../../services/http/room.service';
import { EventService } from '../../../services/util/event.service';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { ModeratorService } from '../../../services/http/moderator.service';

@Component({
  selector: 'app-room-list',
  templateUrl: './room-list.component.html',
  styleUrls: ['./room-list.component.scss']
})
export class RoomListComponent implements OnInit {
  @Input() user: User;
  rooms: Room[] = [];
  roomsWithRole: RoomRoleMixin[];
  closedRooms: Room[];
  baseUrl: string;
  isLoading = true;

  creatorRole = UserRole.CREATOR;
  participantRole = UserRole.PARTICIPANT;
  executiveModeratorRole = UserRole.EXECUTIVE_MODERATOR;

  constructor(
    private roomService: RoomService,
    public eventService: EventService,
    protected authenticationService: AuthenticationService,
    private moderatorService: ModeratorService
  ) {
  }

  ngOnInit() {
    this.getRooms();
    this.eventService.on<any>('RoomDeleted').subscribe(payload => {
      this.rooms = this.rooms.filter(r => r.id !== payload.id);
    });
  }

  getRooms(): void {
    this.roomService.getCreatorRooms().subscribe(rooms => this.updateRoomList(rooms, true));
    this.roomService.getParticipantRooms().subscribe(rooms => this.updateRoomList(rooms));
  }

  updateRoomList(rooms: Room[], isOwner: boolean = false) {
    this.rooms = this.rooms.concat(rooms);
    this.closedRooms = this.rooms.filter(room => room.closed);
    this.roomsWithRole = this.rooms.map(room => {
      const roomWithRole: RoomRoleMixin = <RoomRoleMixin>room;
      if (isOwner) {
        roomWithRole.role = UserRole.CREATOR;
      } else {
        // TODO: acknowledge the other role option too
        roomWithRole.role = UserRole.PARTICIPANT;
        this.moderatorService.get(room.id).subscribe((moderators: Moderator[]) => {
          for (const m of moderators) {
            if (m.userId === this.user.id) {
              roomWithRole.role = UserRole.EXECUTIVE_MODERATOR;
            }
          }
        });
      }
      return roomWithRole;
    });
    this.isLoading = false;
  }

  setCurrentRoom(shortId: string) {
    for (const r of this.roomsWithRole) {
      if (r.shortId === shortId) {
        this.authenticationService.assignRole(r.role);
        localStorage.setItem('shortId', shortId);
      }
    }
  }

  roleToString(role: UserRole): string {
    switch (role) {
      case UserRole.CREATOR:
        return 'creator';
      case UserRole.PARTICIPANT:
        return 'participant';
      case UserRole.EXECUTIVE_MODERATOR:
        return 'moderator';
    }
  }
}
