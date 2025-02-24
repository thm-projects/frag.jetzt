import { room } from 'app/room/state/room';
import { user } from 'app/user/state/user';
import { computedResource } from 'app/utils/computed-resource';
import {
  AssistantThreadService,
  BaseMessage,
  Thread,
} from '../services/assistant-thread.service';
import { map, switchMap } from 'rxjs';
import { inject, signal, WritableSignal } from '@angular/core';
import { UUID } from 'app/utils/ts-utils';
import { getInjector } from 'app/base/angular-init';

// threads

export interface WrappedThread {
  thread: Thread;
  messages: WritableSignal<BaseMessage[]>;
}

export const threads = computedResource({
  request: () => {
    const r = room.value();
    const u = user();
    if (!r || !u) return undefined;
    return r.id;
  },
  loader: (params) =>
    inject(AssistantThreadService)
      .listThreads(params.request)
      .pipe(
        map((threads) => {
          return threads
            .map((thread) => {
              return {
                thread,
                messages: signal(undefined),
              } as WrappedThread;
            })
            .sort(
              (a, b) =>
                b.thread.created_at.getTime() - a.thread.created_at.getTime(),
            );
        }),
      ),
});

// messages

export const loadMessages = (threadId: UUID) => {
  const available = threads.value()?.find((e) => e.thread.id === threadId);
  if (!available) return null;
  return getInjector().pipe(
    switchMap((injector) =>
      injector.get(AssistantThreadService).getMessages(threadId),
    ),
    map((messages) => {
      available.messages.set(messages);
      return available;
    }),
  );
};
