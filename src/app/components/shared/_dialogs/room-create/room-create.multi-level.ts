import { FormControl, Validators } from '@angular/forms';
import {
  MultiLevelData,
  buildInput,
} from '../multi-level-dialog/interface/multi-level-dialog.types';
import { RoomService } from 'app/services/http/room.service';
import { Observable, catchError, map, of, switchMap, take } from 'rxjs';
import { HelpRoomCreateComponent } from './help-room-create/help-room-create.component';
import { AccountStateService } from 'app/services/state/account-state.service';

interface DefaultConfig {
  chatgpt: boolean;
  studdyBuddy: boolean;
  studyBuddyGroup: 'teachers' | 'all';
  profanity: boolean;
  keyword: boolean;
  flashPoll: boolean;
  bonusArchive: boolean;
  quiz: boolean;
  brainstorming: boolean;
  radar: boolean;
  focus: boolean;
  moderation: boolean;
}

export const DEFAULT_TEACHER: DefaultConfig = {
  chatgpt: true,
  studdyBuddy: true,
  studyBuddyGroup: 'teachers',
  profanity: true,
  keyword: true,
  flashPoll: true,
  bonusArchive: true,
  quiz: true,
  brainstorming: true,
  radar: true,
  focus: true,
  moderation: false,
};

export const DEFAULT_STUDENT: DefaultConfig = {
  chatgpt: true,
  studdyBuddy: true,
  studyBuddyGroup: 'all',
  profanity: false,
  keyword: false,
  flashPoll: false,
  bonusArchive: false,
  quiz: false,
  brainstorming: false,
  radar: true,
  focus: true,
  moderation: false,
};

const buildValidator = (
  roomService: RoomService,
  account: AccountStateService,
) => {
  return (control: FormControl): Observable<{ alreadyUsed: boolean }> =>
    account.forceLogin().pipe(
      switchMap(() =>
        roomService.getErrorHandledRoomByShortId(control.value, () => ''),
      ),
      map((room) => {
        if (room) {
          return { alreadyUsed: true };
        }
        return null;
      }),
      catchError(() => of(null)),
    );
};

export const MULTI_LEVEL_ROOM_CREATE: MultiLevelData = {
  title: 'ml-room-create.title',
  buttonSection: 'ml-room-create',
  confirmKey: 'create',
  questions: [
    {
      tag: 'gptInfo',
      title: 'ml-room-create.q-p1-header',
      stepHelp: 'ml-room-create.help.no-chatgpt-for-user',
      active: (_answers, injector) =>
        injector.get(AccountStateService).user$.pipe(
          take(1),
          map((user) => !user || user.isGuest),
        ),
      buildAction(_injector, _answers, previousState) {
        if (previousState) return previousState;
        return buildInput(this, {
          type: 'text',
          value: 'ml-room-create.q-p1-title',
        });
      },
    },
    {
      tag: 'gptSetup',
      title: 'ml-room-create.q-p2-header',
      stepHelp: 'ml-room-create.help.select-openai-setup',
      active: (_answers, injector) =>
        injector.get(AccountStateService).user$.pipe(
          take(1),
          map((user) => user && !user.isGuest),
        ),
      buildAction(_injector, _answers, previousState) {
        if (previousState) return previousState;
        return buildInput(
          this,
          {
            type: 'text',
            value: 'ml-room-create.q-p2-title',
          },
          {
            type: 'radio-select',
            tag: 'setupType',
            label: 'ml-room-create.q-p2-short',
            options: [
              { value: 'apiCode', label: 'ml-room-create.a-p2-api-code' },
              { value: 'voucher', label: 'ml-room-create.a-p2-voucher' },
              { value: 'nothing', label: 'ml-room-create.a-p2-nothing' },
            ],
            validators: [Validators.required],
            errorStates: {
              required: 'ml-room-create.e-p2-required',
            },
          },
        );
      },
    },
    {
      tag: 'gptApiCode',
      title: 'ml-room-create.q-p3-header',
      stepHelp: HelpRoomCreateComponent,
      active: (answers) =>
        answers.gptSetup && answers.gptSetup.value.setupType === 'apiCode',
      buildAction(_injector, _answers, previousState) {
        if (previousState) return previousState;
        return buildInput(
          this,
          {
            type: 'text',
            value: 'ml-room-create.q-p3-title',
          },
          {
            type: 'text-input',
            tag: 'apiCode',
            label: 'ml-room-create.q-p3-short',
            hidden: true,
            validators: [
              Validators.required,
              Validators.pattern('sk-[a-zA-Z0-9]+'),
            ],
            errorStates: {
              required: 'ml-room-create.e-p3-required',
              pattern: 'ml-room-create.e-p3-pattern',
            },
          },
          {
            type: 'text-input',
            tag: 'organization',
            label: 'ml-room-create.q-p3-org',
            validators: [Validators.pattern('org-[a-zA-Z0-9]+')],
            errorStates: {
              pattern: 'ml-room-create.e-p3-org-pattern',
            },
          },
        );
      },
    },
    {
      tag: 'gptVoucher',
      title: 'ml-room-create.q-p4-header',
      stepHelp: 'ml-room-create.help.enter-voucher',
      active: (answers) =>
        answers.gptSetup && answers.gptSetup.value.setupType === 'voucher',
      buildAction(_injector, _answers, previousState) {
        if (previousState) return previousState;
        return buildInput(
          this,
          {
            type: 'text',
            value: 'ml-room-create.q-p4-title',
          },
          {
            type: 'text-input',
            tag: 'voucher',
            hidden: true,
            label: 'ml-room-create.q-p4-short',
            validators: [Validators.required],
            errorStates: {
              required: 'ml-room-create.e-p4-required',
            },
          },
        );
      },
    },
    {
      tag: 'role',
      title: 'ml-room-create.q-1-header',
      stepHelp: 'ml-room-create.help.select-your-role',
      buildAction(_injector, _answers, previousState) {
        if (previousState) return previousState;
        return buildInput(
          this,
          {
            type: 'text',
            value: 'ml-room-create.q-1-title',
          },
          {
            type: 'radio-select',
            tag: 'role-select',
            label: 'ml-room-create.q-1-short',
            options: [
              { value: 'teacher', label: 'ml-room-create.a-1-teacher' },
              { value: 'student', label: 'ml-room-create.a-1-student' },
            ],
            validators: [Validators.required],
            errorStates: {
              required: 'ml-room-create.e-1-required',
            },
          },
        );
      },
    },
    // teacher branch - 1
    {
      tag: 'event',
      title: 'ml-room-create.q-t1-header',
      stepHelp: 'ml-room-create.help.enter-event-name',
      active: (answers) =>
        answers.role && answers.role.value['role-select'] === 'teacher',
      count: (answers) =>
        !answers.role || answers.role.value['role-select'] !== 'student',
      buildAction(_injector, _answers, previousState) {
        return buildInput(
          this,
          {
            type: 'text',
            value: 'ml-room-create.q-t1-title',
          },
          {
            type: 'text-input',
            tag: 'name',
            label: 'ml-room-create.q-t1-short',
            defaultValue: previousState
              ? previousState.group.get('name').value
              : '',
            validators: [
              Validators.required,
              Validators.minLength(3),
              Validators.maxLength(30),
              Validators.pattern('\\S+.*\\S+'),
            ],
            errorStates: {
              required: 'ml-room-create.e-t1-required',
              minlength: 'ml-room-create.e-t1-minlength',
              maxlength: 'ml-room-create.e-t1-maxlength',
              pattern: 'ml-room-create.e-t1-pattern',
            },
          },
          {
            type: 'switch',
            tag: 'code',
            label: 'ml-room-create.q-t1-code',
            defaultValue: previousState
              ? previousState.group.get('code').value
              : false,
          },
          {
            type: 'switch',
            tag: 'settings',
            label: 'ml-room-create.q-t1-settings',
            defaultValue: previousState
              ? previousState.group.get('settings').value
              : false,
          },
        );
      },
    },
    // student branch - 1
    {
      tag: 'event',
      title: 'ml-room-create.q-s1-header',
      stepHelp: 'ml-room-create.help.enter-study-room-name',
      active: (answers) =>
        answers.role && answers.role.value['role-select'] === 'student',
      count: (answers) =>
        !answers.role || answers.role.value['role-select'] !== 'teacher',
      buildAction(_injector, _answers, previousState) {
        return buildInput(
          this,
          {
            type: 'text',
            value: 'ml-room-create.q-s1-title',
          },
          {
            type: 'text-input',
            tag: 'name',
            label: 'ml-room-create.q-s1-short',
            defaultValue: previousState
              ? previousState.group.get('name').value
              : '',
            validators: [
              Validators.required,
              Validators.minLength(3),
              Validators.maxLength(30),
              Validators.pattern('\\S+.*\\S+'),
            ],
            errorStates: {
              required: 'ml-room-create.e-s1-required',
              minlength: 'ml-room-create.e-s1-minlength',
              maxlength: 'ml-room-create.e-s1-maxlength',
              pattern: 'ml-room-create.e-s1-pattern',
            },
          },
          {
            type: 'switch',
            tag: 'code',
            label: 'ml-room-create.q-s1-code',
            defaultValue: previousState
              ? previousState.group.get('code').value
              : false,
          },
          {
            type: 'switch',
            tag: 'settings',
            label: 'ml-room-create.q-t1-settings',
            defaultValue: previousState
              ? previousState.group.get('settings').value
              : false,
          },
        );
      },
    },
    // both - 2
    {
      tag: 'code',
      title: 'ml-room-create.q-2-header',
      stepHelp: 'ml-room-create.help.enter-event-code',
      active: (answers) => answers.event && answers.event.value.code,
      buildAction(injector, _answers, previousState) {
        if (previousState) return previousState;
        return buildInput(
          this,
          {
            type: 'text',
            value: 'ml-room-create.q-2-title',
          },
          {
            type: 'text-input',
            tag: 'code',
            label: 'ml-room-create.q-2-short',
            validators: [
              Validators.required,
              Validators.minLength(3),
              Validators.maxLength(30),
              Validators.pattern('[a-zA-Z0-9_\\-.~]+'),
            ],
            asyncValidators: [
              buildValidator(
                injector.get(RoomService),
                injector.get(AccountStateService),
              ),
            ],
            errorStates: {
              required: 'ml-room-create.e-2-required',
              minlength: 'ml-room-create.e-2-minlength',
              maxlength: 'ml-room-create.e-2-maxlength',
              pattern: 'ml-room-create.e-2-pattern',
              alreadyUsed: 'ml-room-create.e-2-already-used',
            },
          },
        );
      },
    },
    // teacher - 3
    {
      tag: 'general',
      title: 'ml-room-create.q-t3-header',
      stepHelp: 'ml-room-create.help.general-settings-ars',
      active: (answers) =>
        answers.role &&
        answers.event &&
        answers.role.value['role-select'] === 'teacher' &&
        !answers.event.value.settings,
      count: (answers) =>
        !answers.role || answers.role.value['role-select'] !== 'student',
      buildAction(_injector, _answers, previousState) {
        return buildInput(
          this,
          {
            type: 'text',
            value: 'ml-room-create.q-t3-title',
          },
          {
            type: 'switch',
            tag: 'gpt',
            label: 'ml-room-create.q-t3-gpt',
            defaultValue: previousState
              ? previousState.group.get('gpt').value
              : DEFAULT_TEACHER.chatgpt,
          },
          {
            type: 'switch',
            tag: 'moderation',
            label: 'ml-room-create.q-t3-moderation',
            defaultValue: previousState
              ? previousState.group.get('moderation')?.value ??
                DEFAULT_TEACHER.moderation
              : DEFAULT_TEACHER.moderation,
          },
          {
            type: 'switch',
            tag: 'profanity',
            label: 'ml-room-create.q-t3-profanity',
            defaultValue: previousState
              ? previousState.group.get('profanity')?.value ??
                DEFAULT_TEACHER.profanity
              : DEFAULT_TEACHER.profanity,
          },
          {
            type: 'switch',
            tag: 'keywords',
            label: 'ml-room-create.q-t3-keywords',
            defaultValue: previousState
              ? previousState.group.get('keywords').value
              : DEFAULT_TEACHER.keyword,
          },
        );
      },
    },
    // student - 3
    {
      tag: 'general',
      title: 'ml-room-create.q-s3-header',
      stepHelp: 'ml-room-create.help.general-settings-ple',
      active: (answers) =>
        answers.role &&
        answers.event &&
        answers.role.value['role-select'] === 'student' &&
        !answers.event.value.settings,
      count: (answers) =>
        !answers.role || answers.role.value['role-select'] !== 'teacher',
      buildAction(_injector, _answers, previousState) {
        return buildInput(
          this,
          {
            type: 'text',
            value: 'ml-room-create.q-s3-title',
          },
          {
            type: 'switch',
            tag: 'gpt',
            label: 'ml-room-create.q-s3-gpt',
            defaultValue: previousState
              ? previousState.group.get('gpt').value
              : DEFAULT_STUDENT.chatgpt,
          },
          {
            type: 'switch',
            tag: 'keywords',
            label: 'ml-room-create.q-s3-keywords',
            defaultValue: previousState
              ? previousState.group.get('keywords').value
              : DEFAULT_STUDENT.keyword,
          },
        );
      },
    },
    // teacher - 4
    {
      tag: 'gptSettings',
      title: 'ml-room-create.q-t4-header',
      stepHelp: 'ml-room-create.help.gpt-settings-ars',
      active: (answers) =>
        answers.role &&
        answers.general &&
        answers.role.value['role-select'] === 'teacher' &&
        answers.general.value.gpt,
      count: (answers) =>
        !answers.role || answers.role.value['role-select'] !== 'student',
      buildAction(_injector, _answers, previousState) {
        return buildInput(
          this,
          {
            type: 'text',
            value: 'ml-room-create.q-t4-title',
          },
          {
            type: 'radio-select',
            tag: 'study-buddy',
            defaultValue: previousState
              ? previousState.group.get('study-buddy').value
              : DEFAULT_TEACHER.studdyBuddy,
            options: [
              {
                label: 'ml-room-create.a-s4-yes',
                value: true,
              },
              {
                label: 'ml-room-create.a-s4-no',
                value: false,
              },
            ],
          },
        );
      },
    },
    // student - 4
    {
      tag: 'gptSettings',
      title: 'ml-room-create.q-s4-header',
      stepHelp: 'ml-room-create.help.gpt-settings-ple',
      active: (answers) =>
        answers.role &&
        answers.general &&
        answers.role.value['role-select'] === 'student' &&
        answers.general.value.gpt,
      count: (answers) =>
        !answers.role || answers.role.value['role-select'] !== 'teacher',
      buildAction(_injector, _answers, previousState) {
        let state = null;
        state = buildInput(
          this,
          {
            type: 'text',
            value: 'ml-room-create.q-s4-title',
          },
          {
            type: 'radio-select',
            tag: 'study-buddy',
            defaultValue: previousState
              ? previousState.group.get('study-buddy').value
              : DEFAULT_STUDENT.studdyBuddy,
            options: [
              {
                label: 'ml-room-create.a-s4-yes',
                value: true,
              },
              {
                label: 'ml-room-create.a-s4-no',
                value: false,
              },
            ],
          },
        );
        return state;
      },
    },
    // teacher - 5
    {
      tag: 'studyBuddyGroup',
      title: 'ml-room-create.q-t5-header',
      stepHelp: 'ml-room-create.help.study-buddy-settings-ars',
      active: (answers) =>
        answers.role &&
        answers.gptSettings &&
        answers.role.value['role-select'] === 'teacher' &&
        answers.gptSettings.value['study-buddy'],
      count: (answers) =>
        !answers.role || answers.role.value['role-select'] !== 'student',
      buildAction(_injector, _answers, previousState) {
        return buildInput(
          this,
          {
            type: 'text',
            value: 'ml-room-create.q-t5-title',
          },
          {
            type: 'radio-select',
            tag: 'target-group',
            label: 'ml-room-create.q-t5-target-group',
            defaultValue: previousState
              ? previousState.group.get('target-group')?.value ??
                DEFAULT_TEACHER.studyBuddyGroup
              : DEFAULT_TEACHER.studyBuddyGroup,
            options: [
              {
                value: 'teachers',
                label: 'ml-room-create.a-t5-target-group-teacher',
              },
              {
                value: 'all',
                label: 'ml-room-create.a-t5-target-group-student',
              },
            ],
          },
        );
      },
    },
    // teacher - 6
    {
      tag: 'features',
      title: 'ml-room-create.q-t6-header',
      stepHelp: 'ml-room-create.help.features-ars',
      active: (answers) =>
        answers.role &&
        answers.event &&
        answers.role.value['role-select'] === 'teacher' &&
        !answers.event.value.settings,
      count: (answers) =>
        !answers.role || answers.role.value['role-select'] !== 'student',
      buildAction(_injector, _answers, previousState) {
        return buildInput(
          this,
          {
            type: 'text',
            value: 'ml-room-create.q-t6-title',
          },
          {
            type: 'switch',
            tag: 'flash-poll',
            label: 'ml-room-create.q-t6-flash-poll',
            defaultValue: previousState
              ? previousState.group.get('flash-poll')?.value ??
                DEFAULT_TEACHER.flashPoll
              : DEFAULT_TEACHER.flashPoll,
          },
          {
            type: 'switch',
            tag: 'bonus-archive',
            label: 'ml-room-create.q-t6-bonus-archive',
            defaultValue: previousState
              ? previousState.group.get('bonus-archive')?.value ??
                DEFAULT_TEACHER.bonusArchive
              : DEFAULT_TEACHER.bonusArchive,
          },
          {
            type: 'switch',
            tag: 'quiz',
            label: 'ml-room-create.q-t6-quiz',
            defaultValue: previousState
              ? previousState.group.get('quiz')?.value ?? DEFAULT_TEACHER.quiz
              : DEFAULT_TEACHER.quiz,
          },
          {
            type: 'switch',
            tag: 'brainstorming',
            label: 'ml-room-create.q-t6-brainstorming',
            defaultValue: previousState
              ? previousState.group.get('brainstorming').value
              : DEFAULT_TEACHER.brainstorming,
          },
          {
            type: 'switch',
            tag: 'radar',
            label: 'ml-room-create.q-t6-radar',
            defaultValue: previousState
              ? previousState.group.get('radar').value
              : DEFAULT_TEACHER.radar,
          },
          {
            type: 'switch',
            tag: 'focus',
            label: 'ml-room-create.q-t6-focus',
            defaultValue: previousState
              ? previousState.group.get('focus').value
              : DEFAULT_TEACHER.focus,
          },
        );
      },
    },
    // student - 5
    {
      tag: 'features',
      title: 'ml-room-create.q-s5-header',
      stepHelp: 'ml-room-create.help.features-ple',
      active: (answers) =>
        answers.role &&
        answers.event &&
        answers.role.value['role-select'] === 'student' &&
        !answers.event.value.settings,
      count: (answers) =>
        !answers.role || answers.role.value['role-select'] !== 'teacher',
      buildAction(_injector, _answers, previousState) {
        return buildInput(
          this,
          {
            type: 'text',
            value: 'ml-room-create.q-s5-title',
          },
          {
            type: 'switch',
            tag: 'radar',
            label: 'ml-room-create.q-s5-radar',
            defaultValue: previousState
              ? previousState.group.get('radar').value
              : DEFAULT_STUDENT.radar,
          },
          {
            type: 'switch',
            tag: 'focus',
            label: 'ml-room-create.q-s5-focus',
            defaultValue: previousState
              ? previousState.group.get('focus').value
              : DEFAULT_STUDENT.focus,
          },
          {
            type: 'switch',
            tag: 'brainstorming',
            label: 'ml-room-create.q-s5-brainstorming',
            defaultValue: previousState
              ? previousState.group.get('brainstorming').value
              : DEFAULT_STUDENT.brainstorming,
          },
        );
      },
    },
  ],
};
