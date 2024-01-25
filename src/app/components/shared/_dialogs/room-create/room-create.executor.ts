import { Observable, map, merge, switchMap, tap } from 'rxjs';
import { AnsweredMultiLevelData } from '../multi-level-dialog/interface/multi-level-dialog.types';
import { ProfanityFilter, Room } from 'app/models/room';
import { Injector } from '@angular/core';
import { defaultCategories } from 'app/utils/defaultCategories';
import { AppStateService } from 'app/services/state/app-state.service';
import { DEFAULT_STUDENT, DEFAULT_TEACHER } from './room-create.multi-level';
import { RoomService } from 'app/services/http/room.service';
import { TranslateService } from '@ngx-translate/core';
import { GptService } from 'app/services/http/gpt.service';
import { NotificationService } from 'app/services/util/notification.service';
import { AccountStateService } from 'app/services/state/account-state.service';
import { UserRole } from 'app/models/user-roles.enum';
import { Router } from '@angular/router';

export const generateRoom = (
  injector: Injector,
  answers: AnsweredMultiLevelData,
): Observable<Room> => {
  const appState = injector.get(AppStateService);
  const categories =
    defaultCategories[appState.getCurrentLanguage()] ||
    defaultCategories.default;
  // role
  const isTeacher = answers.role.group?.value['role-select'] === 'teacher';
  const defaults = isTeacher ? DEFAULT_TEACHER : DEFAULT_STUDENT;
  // name + short id
  const name = answers.event.group?.value.name;
  const shortId = answers.code?.group?.value?.code;
  // settings
  const general = answers.general?.group?.value;
  const gpt = general?.gpt ?? defaults.chatgpt;
  const moderation = general?.moderation ?? defaults.moderation;
  const profanity = general?.profanity ?? defaults.profanity;
  const keywords = general?.keywords ?? defaults.keyword;
  // gpt settings
  const gptSettings = answers.gptSettings?.group?.value;
  const studdyBuddy = gptSettings?.['study-buddy'] ?? defaults.studdyBuddy;
  // study buddy settings
  const studyBuddySettings = answers.studyBuddyGroup?.group?.value;
  const studdyBuddyGroup =
    studyBuddySettings?.['target-group'] ?? defaults.studyBuddyGroup;
  // feature settings
  const featureSettings = answers.features?.group?.value;
  const flashPoll = featureSettings?.['flash-poll'] ?? defaults.flashPoll;
  const bonusArchive =
    featureSettings?.['bonus-archive'] ?? defaults.bonusArchive;
  const quiz = featureSettings?.quiz ?? defaults.quiz;
  const brainstorming =
    featureSettings?.brainstorming ?? defaults.brainstorming;
  const radar = featureSettings?.radar ?? defaults.radar;
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
    chatGptActive: gpt,
    mode: isTeacher ? 'ARS' : 'PLE',
  });
  const translateService = injector.get(TranslateService);
  const notification = injector.get(NotificationService);
  const accountState = injector.get(AccountStateService);
  const router = injector.get(Router);
  return accountState.forceLogin().pipe(
    switchMap(() => {
      return injector.get(RoomService).addRoom(newRoom, () => {
        translateService
          .get('ml-room-create.something-went-wrong', { longRoomName: name })
          .subscribe((msg) => notification.show(msg));
      });
    }),
    tap((room) => {
      createDefaultTopic(injector, room.id);
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

const createDefaultTopic = (injector: Injector, roomId: string) => {
  const translateService = injector.get(TranslateService);
  const gptService = injector.get(GptService);
  return translateService.get('home-page.gpt-topic-general').pipe(
    switchMap((msg) => {
      return merge(
        gptService.getStatusForRoom(roomId).pipe(
          switchMap(() =>
            gptService.patchPreset(roomId, {
              topics: [
                {
                  description: msg,
                  active: true,
                },
              ],
            }),
          ),
        ),
      );
    }),
  );
};
