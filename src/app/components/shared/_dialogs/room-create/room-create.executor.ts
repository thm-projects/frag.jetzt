/* eslint-disable @typescript-eslint/no-unused-vars */
import { Observable, forkJoin, map, merge, of, switchMap, tap } from 'rxjs';
import { AnsweredMultiLevelData } from '../multi-level-dialog/interface/multi-level-dialog.types';
import { ProfanityFilter, Room } from 'app/models/room';
import { Injector } from '@angular/core';
import { defaultCategories } from 'app/utils/defaultCategories';
import { AppStateService } from 'app/services/state/app-state.service';
import {
  DEFAULT_STUDENT,
  DEFAULT_TEACHER,
  RoomCreateState,
} from './room-create.multi-level';
import { RoomService } from 'app/services/http/room.service';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from 'app/services/util/notification.service';
import { AccountStateService } from 'app/services/state/account-state.service';
import { UserRole } from 'app/models/user-roles.enum';
import { Router } from '@angular/router';
import { forceLogin } from 'app/user/state/user';

export const generateRoom = (
  injector: Injector,
  answers: AnsweredMultiLevelData,
  data: RoomCreateState,
): Observable<Room> => {
  const appState = injector.get(AppStateService);
  const categories =
    defaultCategories[appState.getCurrentLanguage()] ||
    defaultCategories.default;
  // gpt setup
  const gptSetup = answers['gptSetup']?.group?.value?.['setupType'];
  const before: Observable<unknown> = of(null);
  if (gptSetup === 'apiCode') {
    const prevKey = data.apiKeys[0]?.apiKey;
    const newKey = answers['gptApiCode'].group.value['apiCode'];
    const prevOrg = data.apiKeys[0]?.apiOrganization;
    const newOrg = answers['gptApiCode'].group.value['organization'];
  } else if (gptSetup === 'voucher') {
    const prevKey = data.vouchers[0]?.code;
    const newKey = answers['gptVoucher'].group.value['voucher'];
  }
  // role
  const isTeacher = answers['role'].group?.value['role-select'] === 'teacher';
  localStorage.setItem('preferredRole', isTeacher ? 'teacher' : 'student');
  const defaults = isTeacher ? DEFAULT_TEACHER : DEFAULT_STUDENT;
  // name + short id
  const name = answers['event'].group?.value.name;
  const shortId = answers['code']?.group?.value?.code;
  // settings
  const general = answers['general']?.group?.value;

  const isGptActive = (
    answers: AnsweredMultiLevelData,
    isEnabledPerDefault: boolean,
  ): boolean => {
    const answered = answers['gptSetup']?.group?.value?.['setupType'];
    if (answered === 'nothing') {
      // user actively chose to disable chatgpt
      return false;
    }
    if (!answered) {
      // user did not actively choose to enable or disable chatgpt, so we use the default value
      return isEnabledPerDefault;
    }
    // user must have actively chosen to enable chatgpt
    return true;
  };
  const moderation = general?.moderation ?? defaults.moderation;
  const profanity = general?.profanity ?? defaults.profanity;
  const keywords = general?.keywords ?? defaults.keyword;
  // gpt settings
  const gptSettings = answers['gptSettings']?.group?.value;
  const studdyBuddy = gptSettings?.['study-buddy'] ?? defaults.studdyBuddy;
  // study buddy settings
  const studyBuddySettings = answers['studyBuddyGroup']?.group?.value;
  const studdyBuddyGroup =
    studyBuddySettings?.['target-group'] ?? defaults.studyBuddyGroup;
  console.log(studdyBuddy, studdyBuddyGroup);
  // feature settings
  const featureSettings = answers['features']?.group?.value;
  const flashPoll = featureSettings?.['flash-poll'] ?? defaults.flashPoll;
  const bonusArchive =
    featureSettings?.['bonus-archive'] ?? defaults.bonusArchive;
  const quiz = featureSettings?.quiz ?? defaults.quiz;
  const brainstorming =
    featureSettings?.brainstorming ?? defaults.brainstorming;
  // TODO(update room settings)
  const radar = featureSettings?.radar ?? defaults.radar;
  // TODO(update room settings)
  const focus = featureSettings?.focus ?? defaults.focus;
  const newRoom = new Room({
    name,
    tags: [...categories],
    shortId,
    directSend: !moderation,
    profanityFilter: profanity
      ? ProfanityFilter.NONE
      : ProfanityFilter.DEACTIVATED,
    bonusArchiveActive: bonusArchive,
    brainstormingActive: brainstorming,
    quizActive: quiz,
    livepollActive: flashPoll,
    keywordExtractionActive: keywords,
    radarActive: radar,
    focusActive: focus,
    chatGptActive: isGptActive(answers, defaults.chatgpt),
    mode: isTeacher ? 'ARS' : 'PLE',
  });
  const translateService = injector.get(TranslateService);
  const notification = injector.get(NotificationService);
  const accountState = injector.get(AccountStateService);
  const router = injector.get(Router);
  return forkJoin([forceLogin(), before]).pipe(
    switchMap(() => {
      return injector.get(RoomService).addRoom(newRoom, () => {
        translateService
          .get('ml-room-create.something-went-wrong', { longRoomName: name })
          .subscribe((msg) => notification.show(msg));
      });
    }),
    tap((room) => {
      translateService
        .get('ml-room-create.created' + (isTeacher ? '' : '-student'), {
          name,
        })
        .subscribe((msg) => notification.show(msg));
      accountState
        .setAccess(room.shortId, room.id, UserRole.CREATOR)
        .pipe(
          tap(() => {
            accountState.updateAccess(room.shortId);
            router.navigate([
              '/creator/room/' + encodeURIComponent(room.shortId),
            ]);
          }),
        )
        .subscribe();
    }),
  );
};
