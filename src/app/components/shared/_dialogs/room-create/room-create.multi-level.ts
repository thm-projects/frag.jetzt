import { FormControl, Validators } from '@angular/forms';
import {
  MultiLevelData,
  buildInput,
} from '../multi-level-dialog/interface/multi-level-dialog.types';
import { RoomService } from 'app/services/http/room.service';
import { Observable, catchError, map, of } from 'rxjs';

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

const DEFAULT_TEACHER: DefaultConfig = {
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

const DEFAULT_STUDENT: DefaultConfig = {
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

const buildValidator = (roomService: RoomService) => {
  return (control: FormControl): Observable<{ alreadyUsed: boolean }> =>
    roomService
      .getErrorHandledRoomByShortId(control.value, () => '')
      .pipe(
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
      tag: 'role',
      title: 'ml-room-create.q-1-header',
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
      active: (answers) => answers.role.value['role-select'] === 'teacher',
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
            ],
            errorStates: {
              required: 'ml-room-create.e-t1-required',
              minlength: 'ml-room-create.e-t1-minlength',
              maxlength: 'ml-room-create.e-t1-maxlength',
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
      active: (answers) => answers.role.value['role-select'] === 'student',
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
            ],
            errorStates: {
              required: 'ml-room-create.e-s1-required',
              minlength: 'ml-room-create.e-s1-minlength',
              maxlength: 'ml-room-create.e-s1-maxlength',
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
      active: (answers) => answers.event.value.code,
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
            asyncValidators: [buildValidator(injector.get(RoomService))],
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
      active: (answers) =>
        answers.role.value['role-select'] === 'teacher' &&
        !answers.event.value.settings,
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
      active: (answers) =>
        answers.role.value['role-select'] === 'student' &&
        !answers.event.value.settings,
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
      tag: 'gpt-settings',
      title: 'ml-room-create.q-t4-header',
      active: (answers) =>
        answers.role.value['role-select'] === 'teacher' &&
        answers.general?.value?.gpt,
      buildAction(_injector, _answers, previousState) {
        let state = null;
        state = buildInput(
          this,
          {
            type: 'text',
            value: 'ml-room-create.q-t4-title',
          },
          {
            type: 'switch',
            tag: 'study-buddy',
            label: 'ml-room-create.q-t4-study-buddy',
            defaultValue: previousState
              ? previousState.group.get('study-buddy').value
              : DEFAULT_TEACHER.studdyBuddy,
            validators: [
              () => {
                if (state) {
                  state.group.get('target-group').updateValueAndValidity();
                }
                return null;
              },
            ],
          },
          {
            type: 'radio-select',
            tag: 'target-group',
            label: 'ml-room-create.q-t4-target-group',
            defaultValue: previousState
              ? previousState.group.get('target-group')?.value ??
                DEFAULT_TEACHER.studyBuddyGroup
              : DEFAULT_TEACHER.studyBuddyGroup,
            validators: [
              (control) =>
                state && state.group.get('study-buddy').value && !control.value
                  ? { optionRequired: true }
                  : null,
            ],
            options: [
              {
                value: 'teachers',
                label: 'ml-room-create.a-t4-target-group-teacher',
              },
              {
                value: 'all',
                label: 'ml-room-create.a-t4-target-group-student',
              },
            ],
            errorStates: {
              optionRequired: 'ml-room-create.e-t4-option-required',
            },
          },
        );
        return state;
      },
    },
    // student - 4
    {
      tag: 'gpt-settings',
      title: 'ml-room-create.q-s4-header',
      active: (answers) =>
        answers.role.value['role-select'] === 'student' &&
        answers.general?.value?.gpt,
      buildAction(_injector, _answers, previousState) {
        let state = null;
        state = buildInput(
          this,
          {
            type: 'text',
            value: 'ml-room-create.q-s4-title',
          },
          {
            type: 'switch',
            tag: 'study-buddy',
            label: 'ml-room-create.q-s4-study-buddy',
            defaultValue: previousState
              ? previousState.group.get('study-buddy').value
              : DEFAULT_STUDENT.studdyBuddy,
          },
        );
        return state;
      },
    },
    // teacher - 5
    {
      tag: 'features',
      title: 'ml-room-create.q-t5-header',
      active: (answers) =>
        answers.role.value['role-select'] === 'teacher' &&
        !answers.event.value.settings,
      buildAction(_injector, _answers, previousState) {
        return buildInput(
          this,
          {
            type: 'text',
            value: 'ml-room-create.q-t5-title',
          },
          {
            type: 'switch',
            tag: 'flash-poll',
            label: 'ml-room-create.q-t5-flash-poll',
            defaultValue: previousState
              ? previousState.group.get('flash-poll')?.value ??
                DEFAULT_TEACHER.flashPoll
              : DEFAULT_TEACHER.flashPoll,
          },
          {
            type: 'switch',
            tag: 'bonus-archive',
            label: 'ml-room-create.q-t5-bonus-archive',
            defaultValue: previousState
              ? previousState.group.get('bonus-archive')?.value ??
                DEFAULT_TEACHER.bonusArchive
              : DEFAULT_TEACHER.bonusArchive,
          },
          {
            type: 'switch',
            tag: 'quiz',
            label: 'ml-room-create.q-t5-quiz',
            defaultValue: previousState
              ? previousState.group.get('quiz')?.value ?? DEFAULT_TEACHER.quiz
              : DEFAULT_TEACHER.quiz,
          },
          {
            type: 'switch',
            tag: 'brainstorming',
            label: 'ml-room-create.q-t5-brainstorming',
            defaultValue: previousState
              ? previousState.group.get('brainstorming').value
              : DEFAULT_TEACHER.brainstorming,
          },
          {
            type: 'switch',
            tag: 'radar',
            label: 'ml-room-create.q-t5-radar',
            defaultValue: previousState
              ? previousState.group.get('radar').value
              : DEFAULT_TEACHER.radar,
          },
          {
            type: 'switch',
            tag: 'focus',
            label: 'ml-room-create.q-t5-focus',
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
      active: (answers) =>
        answers.role.value['role-select'] === 'student' &&
        !answers.event.value.settings,
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
            label: 'ml-room-create.q-t5-radar',
            defaultValue: previousState
              ? previousState.group.get('radar').value
              : DEFAULT_STUDENT.radar,
          },
          {
            type: 'switch',
            tag: 'focus',
            label: 'ml-room-create.q-t5-focus',
            defaultValue: previousState
              ? previousState.group.get('focus').value
              : DEFAULT_STUDENT.focus,
          },
          {
            type: 'switch',
            tag: 'brainstorming',
            label: 'ml-room-create.q-t5-brainstorming',
            defaultValue: previousState
              ? previousState.group.get('brainstorming').value
              : DEFAULT_STUDENT.brainstorming,
          },
        );
      },
    },
  ],
};
