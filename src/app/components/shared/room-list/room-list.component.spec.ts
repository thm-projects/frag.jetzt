import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Sort } from '@angular/material/sort';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { RoomListComponent } from './room-list.component';
import { RoomService } from '../../../services/http/room.service';
import { EventService } from '../../../services/util/event.service';
import { ModeratorService } from '../../../services/http/moderator.service';
import { CommentService } from '../../../services/http/comment.service';
import { NotificationService } from '../../../services/util/notification.service';
import { BonusTokenService } from '../../../services/http/bonus-token.service';
import { CommentNotificationService } from '../../../services/http/comment-notification.service';
import { AccountStateService } from 'app/services/state/account-state.service';
import { Room } from '../../../models/room';
import { UserRole } from '../../../models/user-roles.enum';

interface RoomQuestionCounts {
  roomId: string;
  questionCount: number;
  responseCount: number;
}

describe('RoomListComponent', () => {
  let component: RoomListComponent;
  let fixture: ComponentFixture<RoomListComponent>;

  let roomServiceMock: jasmine.SpyObj<RoomService>;
  let eventServiceMock: jasmine.SpyObj<EventService>;
  let moderatorServiceMock: jasmine.SpyObj<ModeratorService>;
  let commentServiceMock: jasmine.SpyObj<CommentService>;
  let notificationServiceMock: jasmine.SpyObj<NotificationService>;
  let translateServiceMock: jasmine.SpyObj<TranslateService>;
  let dialogMock: jasmine.SpyObj<MatDialog>;
  let bonusTokenServiceMock: jasmine.SpyObj<BonusTokenService>;
  let commentNotificationServiceMock: jasmine.SpyObj<CommentNotificationService>;
  let accountStateServiceMock: jasmine.SpyObj<AccountStateService>;

  const testRooms: Room[] = [
    { id: '1', shortId: 'abc123', name: 'Test Room 1', ownerId: 'user1' },
    { id: '2', shortId: 'def456', name: 'Test Room 2', ownerId: 'user2' },
  ] as Room[];

  beforeEach(async () => {
    roomServiceMock = jasmine.createSpyObj('RoomService', [
      'getParticipantRooms',
      'getCreatorRooms',
      'removeFromHistory',
      'deleteRoom',
    ]);
    eventServiceMock = jasmine.createSpyObj('EventService', ['on']);
    moderatorServiceMock = jasmine.createSpyObj('ModeratorService', ['get']);
    commentServiceMock = jasmine.createSpyObj('CommentService', [
      'countByRoomId',
    ]);
    notificationServiceMock = jasmine.createSpyObj('NotificationService', [
      'show',
    ]);
    translateServiceMock = jasmine.createSpyObj('TranslateService', ['get']);
    dialogMock = jasmine.createSpyObj('MatDialog', ['open']);
    bonusTokenServiceMock = jasmine.createSpyObj('BonusTokenService', ['get']);
    commentNotificationServiceMock = jasmine.createSpyObj(
      'CommentNotificationService',
      ['findByRoomId'],
    );
    accountStateServiceMock = jasmine.createSpyObj('AccountStateService', [
      'getAccess',
      'setAccess',
      'updateAccess',
      'removeAccess',
    ]);

    roomServiceMock.getParticipantRooms.and.returnValue(of(testRooms));
    roomServiceMock.getCreatorRooms.and.returnValue(of([]));
    eventServiceMock.on.and.returnValue(of({}));
    moderatorServiceMock.get.and.returnValue(of([]));

    const mockCounts: RoomQuestionCounts[] = [
      { roomId: '1', questionCount: 5, responseCount: 2 },
      { roomId: '2', questionCount: 10, responseCount: 3 },
    ];

    commentServiceMock.countByRoomId.and.returnValue(of(mockCounts));
    translateServiceMock.get.and.returnValue(of('Translated text'));
    commentNotificationServiceMock.findByRoomId.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      declarations: [RoomListComponent],
      providers: [
        { provide: RoomService, useValue: roomServiceMock },
        { provide: EventService, useValue: eventServiceMock },
        { provide: ModeratorService, useValue: moderatorServiceMock },
        { provide: CommentService, useValue: commentServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: TranslateService, useValue: translateServiceMock },
        { provide: MatDialog, useValue: dialogMock },
        { provide: BonusTokenService, useValue: bonusTokenServiceMock },
        {
          provide: CommentNotificationService,
          useValue: commentNotificationServiceMock,
        },
        { provide: AccountStateService, useValue: accountStateServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(RoomListComponent);
    component = fixture.componentInstance;

    component.user = { id: 'user1' } as any;
    component.tableDataSource = new MatTableDataSource([]);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should convert role to correct route string', () => {
    expect(component.roleToString(UserRole.CREATOR)).toBe('creator');
    expect(component.roleToString(UserRole.PARTICIPANT)).toBe('participant');
    expect(component.roleToString(UserRole.EXECUTIVE_MODERATOR)).toBe(
      'moderator',
    );
  });

  it('should update account state when setting current room', () => {
    component.setCurrentRoom('abc123');
    expect(accountStateServiceMock.updateAccess).toHaveBeenCalledWith('abc123');
  });

  it('should sort data correctly', () => {
    const sortEvent: Sort = { active: 'name', direction: 'asc' };
    spyOn(component, 'updateTable');

    component.sortData(sortEvent);

    expect(component.currentSort).toBe(sortEvent);
    expect(component.updateTable).toHaveBeenCalled();
  });

  it('should apply filter to table data source', () => {
    const filterValue = 'test';
    spyOn(component, 'updateTable');

    component.applyFilter(filterValue);

    expect(component.tableDataSource.filter).toBe('test');
    expect(component.updateTable).toHaveBeenCalled();
  });
});
