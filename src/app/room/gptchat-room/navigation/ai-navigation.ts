import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import { Injector, Signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  getRoomHeader,
  getRoomNavigation,
} from 'app/navigation/room-navigation';
import { HEADER, NAVIGATION } from 'modules/navigation/m3-navigation-emitter';
import { combineLatest, filter, map } from 'rxjs';
import { RoomStateService } from 'app/services/state/room-state.service';
import { clone } from 'app/utils/ts-utils';
import {
  M3NavigationEntry,
  M3NavigationTemplate,
  getById,
} from 'modules/navigation/m3-navigation.types';
import { Change, ManageAiComponent } from '../manage-ai/manage-ai.component';
import { AssistantEntry } from '../gptchat-room.component';

export interface Data {
  assistants: Signal<AssistantEntry[]>;
  onOutput: (change: Change) => void;
}

export const applyAiNavigation = (injector: Injector, data: Data) => {
  return combineLatest([
    getRoomHeader(injector),
    getAiNavigation(injector, data),
  ]).pipe(
    map(([header, navigation]) => {
      HEADER.set(header);
      NAVIGATION.set(navigation);
    }),
  );
};

export const getAiNavigation = (injector: Injector, data: Data) => {
  const roomState = injector.get(RoomStateService);
  return combineLatest([
    getRoomNavigation(injector),
    toObservable(i18n),
    roomState.assignedRole$.pipe(filter(Boolean)),
  ]).pipe(
    map(([template, i18n, role]) => {
      const isMod = role !== 'Participant';
      template = clone(template) as M3NavigationTemplate;
      const entry = getById(
        template,
        'features.assistant',
      ) as M3NavigationEntry;
      if (!entry) {
        console.error('Menu not found!');
        return template;
      }
      const options: typeof entry.options = [
        isMod && {
          id: 'manage-assistants',
          title: i18n.manageAssistants,
          icon: 'edit_square',
          onClick: () => {
            ManageAiComponent.open(injector, data.assistants, data.onOutput);
            return false;
          },
        },
      ].filter(Boolean);
      if (options.length < 1) return template;
      entry.options = options;
      return template;
    }),
  );
};