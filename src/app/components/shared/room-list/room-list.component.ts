import { Component, OnDestroy, OnInit } from '@angular/core';
import { Room } from '../../../models/room';
import { RoomRoleMixin } from '../../../models/room-role-mixin';
import { User } from '../../../models/user';
import { UserRole } from '../../../models/user-roles.enum';
import { Moderator } from '../../../models/moderator';
import { RoomService } from '../../../services/http/room.service';
import { EventService } from '../../../services/util/event.service';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { ModeratorService } from '../../../services/http/moderator.service';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { CommentService, RoomQuestionCounts } from '../../../services/http/comment.service';
import { NotificationService } from '../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { RemoveFromHistoryComponent } from '../_dialogs/remove-from-history/remove-from-history.component';
import { MatTableDataSource } from '@angular/material/table';
import { BonusTokenService } from '../../../services/http/bonus-token.service';
import { copyCSVString, exportRoom } from '../../../utils/ImportExportMethods';
import { Sort } from '@angular/material/sort';
import { filter, take } from 'rxjs/operators';
import { ModeratorsComponent } from '../../creator/_dialogs/moderators/moderators.component';
import {
  CommentNotificationDialogComponent
} from '../_dialogs/comment-notification-dialog/comment-notification-dialog.component';
import { CommentNotificationService } from '../../../services/http/comment-notification.service';
import { BonusTokenComponent } from '../../creator/_dialogs/bonus-token/bonus-token.component';
import { UserBonusTokenComponent } from '../../participant/_dialogs/user-bonus-token/user-bonus-token.component';
import { RoomSettingsOverviewComponent } from '../_dialogs/room-settings-overview/room-settings-overview.component';

type SortFunc<T> = (a: T, b: T) => number;

const generateMultiSortFunc = <T>(...funcs: SortFunc<T>[]): SortFunc<T> => (a, b) => {
  let value = 0;
  for (const func of funcs) {
    value = func(a, b);
    if (value !== 0) {
      break;
    }
  }
  return value;
};

@Component({
  selector: 'app-room-list',
  templateUrl: './room-list.component.html',
  styleUrls: ['./room-list.component.scss'],
})
export class RoomListComponent implements OnInit, OnDestroy {
  user: User;
  rooms: Room[] = [];
  roomsWithRole: RoomRoleMixin[] = [];
  isLoading = true;
  sub: Subscription;

  tableDataSource: MatTableDataSource<Room>;
  displayedColumns = ['name', 'shortId', 'role', 'moderator-access', 'button'];

  creatorRole = UserRole.CREATOR;
  participantRole = UserRole.PARTICIPANT;
  executiveModeratorRole = UserRole.EXECUTIVE_MODERATOR;

  currentSort: Sort = {
    direction: 'asc',
    active: 'name'
  };
  hasEmail = false;
  private urlToCopy = `${window.location.protocol}//${window.location.host}/participant/room/`;

  constructor(
    private roomService: RoomService,
    public eventService: EventService,
    protected authenticationService: AuthenticationService,
    private moderatorService: ModeratorService,
    private commentService: CommentService,
    public notificationService: NotificationService,
    private translateService: TranslateService,
    public dialog: MatDialog,
    private bonusTokenService: BonusTokenService,
    private commentNotificationService: CommentNotificationService,
  ) {
  }

  ngOnInit() {
    this.authenticationService.watchUser.pipe(
      filter(user => !!user),
      take(1)
    ).subscribe(user => {
      this.user = user;
      this.hasEmail = !!user.loginId;
      this.getRooms();
    });
    this.sub = this.eventService.on<any>('RoomDeleted').subscribe(payload => {
      this.rooms = this.rooms.filter(r => r.id !== payload.id);
      this.roomsWithRole = this.roomsWithRole.filter(r => r.id !== payload.id);
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  showModeratorsDialog(room: Room): void {
    const dialogRef = this.dialog.open(ModeratorsComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.roomId = room.id;
    dialogRef.componentInstance.isCreator = room['role'] === 3;
  }

  getRooms(): void {
    this.roomService.getParticipantRooms(this.user.id).subscribe(rooms => this.updateRoomList(rooms));
    this.roomService.getCreatorRooms(this.user.id).subscribe(rooms => this.updateRoomList(rooms));
  }

  updateRoomList(rooms: Room[]) {
    this.rooms = this.rooms.concat(rooms);
    const newRooms = rooms.map(room => {
      const roomWithRole: RoomRoleMixin = room as RoomRoleMixin;
      if (room.ownerId === this.user.id) {
        roomWithRole.role = UserRole.CREATOR;
        this.authenticationService.setAccess(room.shortId, UserRole.CREATOR);
        return roomWithRole;
      }
      roomWithRole.role = UserRole.PARTICIPANT;
      this.moderatorService.get(room.id).subscribe((moderators: Moderator[]) => {
        if (moderators.some(m => m.accountId === this.user.id)) {
          this.authenticationService.setAccess(room.shortId, UserRole.EXECUTIVE_MODERATOR);
          roomWithRole.role = UserRole.EXECUTIVE_MODERATOR;
        } else {
          this.authenticationService.setAccess(room.shortId, UserRole.PARTICIPANT);
        }
      });
      return roomWithRole;
    });
    this.roomsWithRole = this.roomsWithRole.concat(newRooms);
    this.isLoading = false;
    const ids = newRooms.map(r => r.id);
    this.commentService.countByRoomId(ids.map(id => ({ roomId: id, ack: true }))).subscribe(counts => {
      const cache = {} as { [key in string]: RoomQuestionCounts };
      counts.forEach((count, i) => cache[ids[i]] = count);
      newRooms.forEach(r => {
        r.commentCount = cache[r.id]?.questionCount || 0;
        r.responseCount = cache[r.id]?.responseCount || 0;
      });
    });
    for (const room of newRooms) {
      this.commentNotificationService.findByRoomId(room.id).subscribe(value => {
        room.hasNotifications = !!value?.length;
      });
    }
    this.updateTable();
  }

  setCurrentRoom(shortId: string) {
    for (const r of this.roomsWithRole) {
      if (r.shortId === shortId) {
        this.authenticationService.assignRole(r.role);
      }
    }
  }

  removeSession(room: RoomRoleMixin) {
    const dialogRef = this.dialog.open(RemoveFromHistoryComponent, {
      width: '400px',
    });
    dialogRef.componentInstance.roomName = room.name;
    dialogRef.componentInstance.role = room.role;
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'remove') {
        if (room.role < 3) {
          this.removeFromHistory(room);
        } else {
          this.deleteRoom(room);
        }
        this.rooms = this.rooms.filter(r => r.id !== room.id);
        this.roomsWithRole = this.roomsWithRole.filter(r => r.id !== room.id);
        this.updateTable();
      } else {
        this.translateService.get('room-list.canceled-remove').subscribe(msg => {
          this.notificationService.show(msg);
        });
      }
    });
  }

  deleteRoom(room: Room) {
    this.roomService.deleteRoom(room.id).subscribe(() => {
      this.translateService.get('room-list.room-successfully-deleted').subscribe(msg => {
        this.notificationService.show(msg);
      });
    });
  }

  removeFromHistory(room: Room) {
    this.roomService.removeFromHistory(room.id).subscribe(() => {
      this.translateService.get('room-list.room-successfully-removed').subscribe(msg => {
        this.notificationService.show(msg);
      });
    });
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

  updateTable(): void {
    const data = [...this.roomsWithRole];
    if (this.currentSort?.direction) {
      switch (this.currentSort.active) {
        case 'name':
          data.sort(this.generateSortFunc('name', this.currentSort.direction === 'desc'));
          break;
        case 'shortId':
          data.sort(this.generateSortFunc('shortId', this.currentSort.direction === 'desc'));
          break;
        case 'role':
          data.sort(generateMultiSortFunc(
            this.generateSortFunc('role', this.currentSort.direction === 'desc'),
            this.generateSortFunc('name', false)
          ));
          break;
      }
    }
    const previousFilter = this.tableDataSource?.filter;
    this.tableDataSource = new MatTableDataSource(previousFilter ? data.filter(elem =>
      elem.name.toLowerCase().includes(previousFilter) ||
      elem.shortId.toLowerCase().includes(previousFilter)
    ) : data);
  }

  sortData(sort: Sort): void {
    this.currentSort = sort;
    this.updateTable();
  }

  applyFilter(filterValue: string): void {
    this.tableDataSource.filter = filterValue.trim().toLowerCase();
    this.updateTable();
  }

  openNotifications(room: Room) {
    const dialogRef = this.dialog.open(CommentNotificationDialogComponent, {
      minWidth: '80%'
    });
    dialogRef.componentInstance.room = room;
  }

  exportCsv(room: Room) {
    this.moderatorService.get(room.id).subscribe(mods => {
      exportRoom(this.translateService,
        this.notificationService,
        this.bonusTokenService,
        this.commentService,
        'room-export',
        this.user,
        room,
        new Set<string>(mods.map(mod => mod.accountId))
      ).subscribe(text => {
        copyCSVString(text[0], room.name + '-' + room.shortId + '-' + text[1] + '.csv');
      });
    });
  }

  openBonusTokens(room: Room) {
    console.assert(room['role'] > UserRole.PARTICIPANT);
    const dialogRef = this.dialog.open(BonusTokenComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.room = room;
  }

  openRoomSettingsOverview(room: Room) {
    console.assert(room['role'] > UserRole.PARTICIPANT);
    const ref = this.dialog.open(RoomSettingsOverviewComponent, {
      width: '600px',
    });
    ref.componentInstance.room = room;
    ref.componentInstance.awaitComplete = true;
    ref.afterClosed().subscribe(data => {
      if (typeof data === 'object') {
        for (const key of Object.keys(data)) {
          room[key] = data[key];
        }
      }
    });
  }

  openMyBonusTokens() {
    const dialogRef = this.dialog.open(UserBonusTokenComponent, {
      width: '600px'
    });
    dialogRef.componentInstance.userId = this.user.id;
  }

  copyShortId(room: Room): void {
    navigator.clipboard.writeText(`${this.urlToCopy}${room.shortId}`).then(() => {
      this.translateService.get('header.session-id-copied').subscribe(msg => {
        this.notificationService.show(msg, '', { duration: 2000 });
      });
    }, () => {
      console.log('Clipboard write failed.');
    });
  }

  private generateSortFunc(name: string, reverse: boolean): SortFunc<RoomRoleMixin> {
    const factor = reverse ? -1 : 1;
    switch (name) {
      case 'name':
        return (a, b) =>
          factor * a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      case 'shortId':
        return (a, b) =>
          factor * a.shortId.localeCompare(b.shortId, undefined, { sensitivity: 'base' });
      case 'role':
        return (a, b) => factor * (a.role - b.role);
    }
    throw new Error('Unknown name in sorting!');
  }
}
