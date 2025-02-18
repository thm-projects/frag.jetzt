import { Injectable } from '@angular/core';
import { RoomAPI, RoomService } from '../http/room.service';
import { ProfanityFilter, Room } from '../../models/room';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserRole } from '../../models/user-roles.enum';
import {
  generateConsequentlyUUID,
  generateRandomUUID,
  generateShortId,
} from '../../utils/test-utils';
import { defaultCategories } from '../../utils/defaultCategories';
import { UUID } from 'app/utils/ts-utils';
import { AccountStateService } from '../state/account-state.service';
import { Router } from '@angular/router';
import { user as user2 } from 'app/user/state/user';

interface RoomHistory {
  userId: string;
  roomId: string;
  role: UserRole;
}

@Injectable()
export class RoomServiceMock extends RoomService {
  private static readonly _roomMock = {
    id: '' as UUID,
    ownerId: '' as UUID,
    shortId: '',
    abbreviation: '00000000',
    name: '',
    description: '',
    blacklist: '[]',
    closed: false,
    moderated: true,
    directSend: true,
    threshold: 0,
    tags: [...defaultCategories.en],
    questionsBlocked: false,
    profanityFilter: ProfanityFilter.NONE,
    blacklistIsActive: true,
    brainstormingSession: null,
    tagCloudSettings: '',
    moderatorRoomReference: null,
    createdAt: new Date(),
    updatedAt: null,
    lastVisitCreator: new Date(),
    bonusArchiveActive: true,
    quizActive: true,
    brainstormingActive: true,
    conversationDepth: 7,
    blacklistActive: true,
    language: 'en',
    keywordExtractionActive: true,
    livepollActive: false,
    livepollSession: null,
    radarActive: true,
    focusActive: true,
    chatGptActive: true,
    mode: 'ARS',
  } as Readonly<Room>;

  rooms: Readonly<Room>[] = [];
  roomHistories: Readonly<RoomHistory>[] = [];
  moderators: Map<string, Set<string>> = new Map<string, Set<string>>();

  constructor(
    private account: AccountStateService,
    private router1: Router,
  ) {
    super(null, null, null, null, null);
  }

  public static generateMockRoom(
    shortId: string,
    name: string,
    ownerId = generateRandomUUID(),
  ): Room {
    return { ...this._roomMock, ownerId, shortId };
  }

  override getCreatorRooms(userId: string): Observable<Room[]> {
    return of(this.rooms.filter((r) => r.ownerId === userId));
  }

  override getParticipantRooms(userId: string): Observable<Room[]> {
    return of(
      this.roomHistories
        .filter(
          (history) =>
            history.userId === userId && history.role < UserRole.CREATOR,
        )
        .map((history) => this.rooms.find((r) => r.id === history.roomId)),
    );
  }

  override addRoom(room: Room, exc?: () => void): Observable<Room> {
    this.validateRoom(room);
    room.ownerId = user2().id;
    if (!room.shortId) {
      room.shortId = this.generateNoDuplicateShortId();
    }
    room.shortId = room.shortId.trim();
    if (room.shortId.length < 1 || room.shortId.length > 30) {
      throw new Error('Forbidden');
    }
    if (this.rooms.find((r) => r.shortId === room.shortId)) {
      throw new Error('Conflict');
    }
    room.id = generateConsequentlyUUID();
    this.rooms.push({ ...room });
    const roomCode = RoomServiceMock.generateMockRoom(
      this.generateNoDuplicateShortId(),
      room.name,
      room.ownerId,
    );
    roomCode.moderatorRoomReference = room.id;
    roomCode.id = generateConsequentlyUUID();
    this.rooms.push(roomCode);
    exc?.();
    return of(room);
  }

  override getRoom(id: string): Observable<Room> {
    const room = this.rooms.find((r) => r.id === id);
    if (!room) {
      throw new Error('Not Found');
    }
    return of(room);
  }

  override getRoomByShortId(shortId: string): Observable<Room> {
    const room = this.rooms.find((r) => r.shortId === shortId);
    if (!room) {
      throw new Error('Not Found');
    }
    return of(room);
  }

  override getErrorHandledRoomByShortId(
    shortId: string,
    err: () => void,
  ): Observable<Room> {
    return this.getRoomByShortId(shortId).pipe(
      catchError(this.buildErrorCallback(`getRoom shortId=${shortId}`, err)),
    );
  }

  override addToHistory(roomId: string): void {
    const user = user2();
    const roomIndex = this.rooms.findIndex((r) => r.id === roomId);
    if (roomIndex < 0) {
      throw new Error('Not Found');
    }
    const index = this.roomHistories.findIndex(
      (history) => history.roomId === roomId && history.userId === user.id,
    );
    const newElement: RoomHistory = {
      userId: user.id,
      roomId,
      role: UserRole.PARTICIPANT,
    };
    if (index < 0) {
      this.roomHistories.push(newElement);
      return;
    }
    this.roomHistories.splice(index, 1, newElement);
  }

  override removeFromHistory(roomId: string): Observable<void> {
    const user = user2();
    const index = this.roomHistories.findIndex(
      (history) => history.roomId === roomId && history.userId === user.id,
    );
    if (index < 0) {
      return of(null);
    }
    this.roomHistories.splice(index, 1);
    return of(null);
  }

  override updateRoom(updatedRoom: Room): Observable<RoomAPI> {
    if (!updatedRoom?.id) {
      throw new Error('id can not be null!');
    }
    const roomIndex = this.rooms.findIndex((r) => r.id === updatedRoom.id);
    if (roomIndex < 0) {
      throw new Error('Not Found');
    }
    const room = this.rooms[roomIndex];
    if (!this.canChangeRoom(updatedRoom, room)) {
      throw new Error('Forbidden');
    }
    this.validateRoom(updatedRoom);
    this.rooms.splice(roomIndex, 1, { ...updatedRoom });
    return of(updatedRoom as unknown as RoomAPI);
  }

  override deleteRoom(roomId: string): Observable<void> {
    const roomIndex = this.rooms.findIndex((r) => r.id === roomId);
    if (roomIndex < 0) {
      throw new Error('Not Found');
    }
    const room = this.rooms[roomIndex];
    if (room.ownerId !== user2().id) {
      throw new Error('Forbidden');
    }
    this.rooms.splice(roomIndex, 1);
    this.moderators.delete(roomId);
    this.roomHistories
      .map((history, i) => [history, i] as [RoomHistory, number])
      .filter(([history]) => history.roomId === roomId)
      .reverse()
      .forEach(([, i]) => this.roomHistories.splice(i, 1));
    return of();
  }

  override createGuestsForImport(
    roomId: string,
    guestCount: number,
  ): Observable<string[]> {
    const arr = [];
    for (let i = 0; i < guestCount; i++) {
      arr.push(generateConsequentlyUUID());
    }
    return of(arr);
  }

  override handleRoomError<T>() {
    return (error: object): Observable<T> => {
      console.error(error);
      if ('status' in error && error.status === 404) {
        this.router1.navigateByUrl('');
      }
      return throwError(() => error);
    };
  }

  private buildErrorCallback(data: string, exc: () => void) {
    return (error: object) => {
      if (exc) {
        exc();
      }
      return this.handleError<Room>(data)(error);
    };
  }

  private generateNoDuplicateShortId(): string {
    let shortId = generateShortId();
    while (this.rooms.find((r) => r.shortId === shortId)) {
      shortId = generateShortId();
    }
    return shortId;
  }

  private canChangeRoom(room: Room, oldRoom: Room) {
    if (
      oldRoom.id !== room.id ||
      oldRoom.shortId !== room.shortId ||
      oldRoom.ownerId !== room.ownerId
    ) {
      return false;
    }
    const id = user2().id;
    if (id === oldRoom.ownerId) {
      return true;
    }
    const mods = this.moderators.get(oldRoom.id);
    return Boolean(mods?.has(id));
  }

  private validateRoom(room: Room) {
    if (
      !room ||
      !room.name ||
      room.name.length > 30 ||
      !room.description ||
      room.description.length > 5000
    ) {
      throw new Error('Bad Request');
    }
  }
}
