import { effect } from '@angular/core';
import { getInjector } from 'app/base/angular-init';
import { Subject, Subscription } from 'rxjs';
import { room } from './room';
import { WsRoomService } from 'app/services/websockets/ws-room.service';
import { environment } from 'environments/environment';
import { Room } from 'app/models/room';
import { BrainstormingSession } from 'app/models/brainstorming-session';
import { LivepollSession } from 'app/models/livepoll-session';
import { UUID } from 'app/utils/ts-utils';
import { updateCategories } from './brainstorming';
import { BrainstormingCategory } from 'app/models/brainstorming-category';
import { BrainstormingWord } from 'app/models/brainstorming-word';

interface Message {
  type: string;
  payload: {
    sessionId: UUID;
    id: UUID;
    changes?: Record<string, unknown>;
    name: string;
    correctedWord: string;
    wordId: UUID;
    upvotes: number;
    downvotes: number;
    livepoll: LivepollSession;
  };
}

export interface RoomPatch {
  type: 'RoomPatched';
  patched: Partial<Room>;
}

export interface BrainstormCategoryReset {
  type: 'BrainstormingCategorizationReset';
  sessionId: UUID;
}

export interface BrainstormUpdateCategories {
  type: 'BrainstormingCategoriesUpdated';
  categoryList: BrainstormingCategory[];
}

export interface BrainstormPatched {
  type: 'BrainstormingPatched';
  sessionId: UUID;
  changes: Record<string, unknown>;
}

export interface BrainstormVoteReset {
  type: 'BrainstormingVotesReset';
  sessionId: UUID;
}

export interface BrainstormWordCreated {
  type: 'BrainstormingWordCreated';
  wordId: UUID;
  sessionId: UUID;
  word: string;
  correctedWord: string;
}

export interface BrainstormWordPatched {
  type: 'BrainstormingWordPatched';
  wordId: UUID;
  changes: Partial<BrainstormingWord>;
}

export interface BrainstormVoteUpdate {
  type: 'BrainstormingVoteUpdated';
  wordId: UUID;
  upvotes: number;
  downvotes: number;
}

export interface LivepollCreated {
  type: 'LivepollSessionCreated';
  session: LivepollSession;
}

export interface LivepollPatched {
  type: 'LivepollSessionPatched';
  session: Partial<LivepollSession>;
}

export type RoomUpdate =
  | RoomPatch
  | BrainstormCategoryReset
  | BrainstormUpdateCategories
  | BrainstormPatched
  | BrainstormVoteReset
  | BrainstormWordCreated
  | BrainstormWordPatched
  | BrainstormVoteUpdate
  | LivepollCreated
  | LivepollPatched;

export const beforeUpdate = new Subject<RoomUpdate>();
export const afterUpdate = new Subject<RoomUpdate>();

let lastSubscription: Subscription = null;

getInjector().subscribe((injector) => {
  effect(
    () => {
      const r = room();
      lastSubscription?.unsubscribe();
      if (!r) {
        return;
      }
      lastSubscription = injector
        .get(WsRoomService)
        .getRoomStream(r.id)
        .subscribe(handleMessage);
    },
    { injector },
  );
});

const handleMessage = (msg: { body: string }) => {
  const r = room();
  const message = JSON.parse(msg.body);
  if (message.roomId && message.roomId !== r.id) {
    console.error('Wrong room!', message);
    return;
  }
  if (message.type === 'RoomPatched') {
    const updatedRoom: Partial<Room> = message.payload.changes;
    const update = {
      type: 'RoomPatched',
      patched: updatedRoom,
    } satisfies RoomPatch;
    beforeUpdate.next(update);
    updateCurrentRoom(updatedRoom, r);
    afterUpdate.next(update);
  } else if (
    message.type === 'BrainstormingDeleted' &&
    r.brainstormingSession?.id === message.payload.id
  ) {
    const update = {
      type: 'RoomPatched',
      patched: { brainstormingSession: null },
    } satisfies RoomPatch;
    beforeUpdate.next(update);
    r.brainstormingSession = null;
    afterUpdate.next(update);
  } else if (message.type === 'BrainstormingCreated') {
    const newSession = new BrainstormingSession(message.payload.session);
    const update = {
      type: 'RoomPatched',
      patched: { brainstormingSession: newSession },
    } satisfies RoomPatch;
    beforeUpdate.next(update);
    r.brainstormingSession = newSession;
    afterUpdate.next(update);
  } else if (message.type === 'BrainstormingVoteUpdated') {
    onBrainstormingVoteUpdated(message, r);
  } else if (message.type === 'BrainstormingWordCreated') {
    onBrainstormingWordCreated(message, r);
  } else if (message.type === 'BrainstormingWordPatched') {
    onBrainstormingWordPatched(message, r);
  } else if (message.type === 'BrainstormingCategoriesUpdated') {
    const categoryList: BrainstormingCategory[] = message.payload.categoryList;
    const update = {
      type: 'BrainstormingCategoriesUpdated',
      categoryList,
    } satisfies BrainstormUpdateCategories;
    beforeUpdate.next(update);
    updateCategories(message.payload.categoryList);
    afterUpdate.next(update);
  } else if (message.type === 'BrainstormingVotesReset') {
    onBrainstormingVoteReset(message, r);
  } else if (message.type === 'BrainstormingPatched') {
    onBrainstormingPatched(message, r);
  } else if (message.type === 'BrainstormingCategorizationReset') {
    onBrainstormingCategorizationReset(message, r);
  } else if (message.type === 'LivepollSessionCreated') {
    onLivepollCreated(message, r);
  } else if (message.type === 'LivepollSessionPatched') {
    onLivepollPatched(message, r);
  } else if (!environment.production) {
    console.log('Ignored: ', message);
  }
};

const updateCurrentRoom = (room: Partial<Room>, current: Room) => {
  for (const key of Object.keys(room)) {
    current[key] = room[key];
  }
};

const onBrainstormingCategorizationReset = (message: Message, room: Room) => {
  const id = room.brainstormingSession?.id;
  if (id !== message.payload.sessionId) {
    return;
  }
  const update = {
    type: 'BrainstormingCategorizationReset',
    sessionId: id,
  } satisfies BrainstormCategoryReset;
  beforeUpdate.next(update);
  const obj = room.brainstormingSession.wordsWithMeta;
  Object.keys(obj).forEach((key) => (obj[key].word.categoryId = null));
  afterUpdate.next(update);
};

const onBrainstormingPatched = (message: Message, room: Room) => {
  const id = room.brainstormingSession?.id;
  if (id !== message.payload.id) {
    return;
  }
  const session: Partial<BrainstormingSession> = message.payload.changes;
  const update = {
    type: 'BrainstormingPatched',
    changes: session,
    sessionId: id,
  } satisfies BrainstormPatched;
  beforeUpdate.next(update);
  Object.keys(session).forEach((key) => {
    const change = message.payload.changes[key];
    if (key === 'ideasEndTimestamp' && change) {
      room.brainstormingSession[key] = new Date(change as Date);
    } else {
      room.brainstormingSession[key] = change;
    }
  });
  afterUpdate.next(update);
};

const onBrainstormingVoteReset = (message: Message, room: Room) => {
  const id = room.brainstormingSession?.id;
  if (id !== message.payload.sessionId) {
    return;
  }
  const update = {
    type: 'BrainstormingVotesReset',
    sessionId: id,
  } satisfies BrainstormVoteReset;
  beforeUpdate.next(update);
  const obj = room.brainstormingSession.wordsWithMeta;
  Object.keys(obj).forEach((key) => {
    obj[key].ownHasUpvoted = null;
    obj[key].word.downvotes = 0;
    obj[key].word.upvotes = 0;
  });
  afterUpdate.next(update);
};

const onBrainstormingWordPatched = (message: Message, room: Room) => {
  const wordId = message.payload.id;
  const entry = room.brainstormingSession?.wordsWithMeta?.[wordId];
  if (!entry) {
    return;
  }
  const word: Partial<BrainstormingWord> = message.payload.changes;
  const update = {
    type: 'BrainstormingWordPatched',
    wordId,
    changes: word,
  } satisfies BrainstormWordPatched;
  beforeUpdate.next(update);
  Object.keys(word).forEach((key) => {
    entry.word[key] = word[key];
  });
  afterUpdate.next(update);
};

const onBrainstormingWordCreated = (message: Message, room: Room) => {
  const word = new BrainstormingWord({} as BrainstormingWord);
  word.id = message.payload.id;
  word.sessionId = message.payload.sessionId;
  word.word = message.payload.name;
  word.correctedWord = message.payload.correctedWord;
  if (word.sessionId !== room.brainstormingSession?.id) {
    console.error('Wrong session');
    return;
  }
  const update = {
    type: 'BrainstormingWordCreated',
    wordId: word.id,
    sessionId: word.sessionId,
    word: word.word,
    correctedWord: word.correctedWord,
  } satisfies BrainstormWordCreated;
  beforeUpdate.next(update);
  room.brainstormingSession.wordsWithMeta[word.id] = {
    word,
    ownHasUpvoted: null,
  };
  afterUpdate.next(update);
};

const onBrainstormingVoteUpdated = (message: Message, room: Room) => {
  const wordId = message.payload.wordId;
  const upvotes = message.payload.upvotes;
  const downvotes = message.payload.downvotes;
  const entry = room.brainstormingSession?.wordsWithMeta?.[wordId];
  if (!entry) {
    return;
  }
  const update = {
    type: 'BrainstormingVoteUpdated',
    wordId,
    upvotes,
    downvotes,
  } satisfies BrainstormVoteUpdate;
  beforeUpdate.next(update);
  entry.word.downvotes = downvotes;
  entry.word.upvotes = upvotes;
  afterUpdate.next(update);
};

const onLivepollCreated = (message: Message, room: Room) => {
  const livepollSessionObject = new LivepollSession(message.payload.livepoll);
  const update = {
    type: 'LivepollSessionCreated',
    session: livepollSessionObject,
  } satisfies LivepollCreated;
  beforeUpdate.next(update);
  //this._currentLivepollSession.next(livepollSessionObject);
  room.livepollSession = livepollSessionObject;
  afterUpdate.next(update);
  /*this.livepollService.emitEvent(
    this.currentLivepoll,
    {},
    LivepollEventType.Create,
  );*/
};

const onLivepollPatched = (message: Message, room: Room) => {
  const id = room.livepollSession?.id;
  if (id !== message.payload.id) {
    // skip
    return;
  }
  const changes: Partial<LivepollSession> = message.payload.changes;
  const update = {
    type: 'LivepollSessionPatched',
    session: changes,
  } satisfies LivepollPatched;
  beforeUpdate.next(update);
  //const livepoll = injector.get(LivepollService);
  if (typeof changes['active'] !== 'undefined') {
    if (!changes['active']) {
      room.livepollSession = null;
      //const cached = this.currentLivepoll;
      //this._currentLivepollSession.next(null);
      //livepoll.emitEvent(cached, changes, LivepollEventType.Delete);
    }
  } else {
    for (const key of Object.keys(changes)) {
      room.livepollSession[key] = changes[key];
    }
    /*livepoll.emitEvent(
      this.currentLivepoll,
      changes,
      LivepollEventType.Patch,
    );*/
  }
  afterUpdate.next(update);
};
