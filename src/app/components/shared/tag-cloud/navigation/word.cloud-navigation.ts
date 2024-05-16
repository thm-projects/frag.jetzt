import {
  getRoomHeader,
  getRoomNavigation,
} from 'app/navigation/room-navigation';
import rawRadari18n from './radar-i18n.json';
const radari18n = I18nLoader.loadModule(rawRadari18n);
import { I18nLoader } from 'app/base/i18n/i18n-loader';
import { Injector } from '@angular/core';
import { combineLatest, filter, map } from 'rxjs';
import { HEADER, NAVIGATION } from 'modules/navigation/m3-navigation-emitter';
import { toObservable } from '@angular/core/rxjs-interop';
import { clone } from 'app/utils/ts-utils';
import {
  M3NavigationEntry,
  M3NavigationTemplate,
  getById,
} from 'modules/navigation/m3-navigation.types';
import { MatDialog } from '@angular/material/dialog';
import { TopicCloudAdministrationComponent } from '../../_dialogs/topic-cloud-administration/topic-cloud-administration.component';
import {
  ROOM_ROLE_MAPPER,
  RoomStateService,
} from 'app/services/state/room-state.service';
import { WorkerConfigDialogComponent } from '../../_dialogs/worker-config-dialog/worker-config-dialog.component';

export const applyRadarNavigation = (
  injector: Injector,
  drawerToggle: () => boolean,
) => {
  return combineLatest([
    getRoomHeader(injector),
    getRadarNavigation(injector, drawerToggle),
  ]).pipe(
    map(([header, navigation]) => {
      HEADER.set(header);
      NAVIGATION.set(navigation);
    }),
  );
};

export const getRadarNavigation = (
  injector: Injector,
  drawerToggle: () => boolean,
) => {
  const roomState = injector.get(RoomStateService);
  return combineLatest([
    getRoomNavigation(injector),
    toObservable(radari18n),
    roomState.assignedRole$.pipe(filter(Boolean)),
  ]).pipe(
    map(([template, i18n, role]) => {
      const isMod = role !== 'Participant';
      template = clone(template) as M3NavigationTemplate;
      const entry = getById(template, 'features.radar') as M3NavigationEntry;
      if (!entry) {
        console.error('Menu not found!');
        return template;
      }
      entry.options = [
        {
          id: 'cloud-config',
          title: i18n.config,
          icon: 'format_paint',
          onClick: drawerToggle,
        },
        isMod && {
          id: 'admin',
          title: i18n.admin,
          icon: 'handyman',
          onClick: () => {
            openTopicCloud(injector);
            return true;
          },
        },
        isMod && {
          id: 'update-keywords',
          title: i18n.updateKeywords,
          icon: 'auto_fix_high',
          onClick: () => {
            openUpdateKeywords(injector);
            return true;
          },
        },
      ].filter(Boolean);
      return template;
    }),
  );
};

const openUpdateKeywords = (injector: Injector) => {
  WorkerConfigDialogComponent.addTask(
    injector.get(MatDialog),
    injector.get(RoomStateService).getCurrentRoom(),
  );
};

const openTopicCloud = (injector: Injector) => {
  injector.get(MatDialog).open(TopicCloudAdministrationComponent, {
    data: {
      userRole:
        ROOM_ROLE_MAPPER[
          injector.get(RoomStateService).getCurrentAssignedRole()
        ],
    },
  });
};
