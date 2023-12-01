import { FormControl, Validators } from '@angular/forms';
import {
  MultiLevelData,
  buildInput,
} from '../multi-level-dialog/interface/multi-level-dialog.types';
import { RoomService } from 'app/services/http/room.service';
import { Observable, catchError, map, of } from 'rxjs';

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
    // teacher branch
    {
      tag: 'event',
      title: 'ml-room-create.q-t1-header',
      active: (answers) => answers.role.value['role-select'] === 'teacher',
      buildAction(_injector, _answers, previousState) {
        if (previousState) return previousState;
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
            defaultValue: false,
          },
          {
            type: 'switch',
            tag: 'settings',
            label: 'ml-room-create.q-t1-settings',
            defaultValue: false,
          },
        );
      },
    },
    {
      tag: 'code',
      title: 'ml-room-create.q-t2-header',
      active: (answers) =>
        answers.role.value['role-select'] === 'teacher' &&
        answers.event.value.code,
      buildAction(injector, _answers, previousState) {
        if (previousState) return previousState;
        return buildInput(
          this,
          {
            type: 'text',
            value: 'ml-room-create.q-t2-title',
          },
          {
            type: 'text-input',
            tag: 'code',
            label: 'ml-room-create.q-t2-short',
            validators: [
              Validators.required,
              Validators.minLength(3),
              Validators.maxLength(30),
              Validators.pattern('[a-zA-Z0-9_\\-.~]+'),
            ],
            asyncValidators: [buildValidator(injector.get(RoomService))],
            errorStates: {
              required: 'ml-room-create.e-t2-required',
              minlength: 'ml-room-create.e-t2-minlength',
              maxlength: 'ml-room-create.e-t2-maxlength',
              pattern: 'ml-room-create.e-t2-pattern',
              alreadyUsed: 'ml-room-create.e-t2-already-used',
            },
          },
        );
      },
    },
    {
      tag: 'general',
      title: 'ml-room-create.q-t3-header',
      active: (answers) =>
        answers.role.value['role-select'] === 'teacher' &&
        !answers.event.value.settings,
      buildAction(_injector, _answers, previousState) {
        if (previousState) return previousState;
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
            defaultValue: false,
          },
          {
            type: 'switch',
            tag: 'moderation',
            label: 'ml-room-create.q-t3-moderation',
            defaultValue: false,
          },
          {
            type: 'switch',
            tag: 'profanity',
            label: 'ml-room-create.q-t3-profanity',
            defaultValue: false,
          },
          {
            type: 'switch',
            tag: 'keywords',
            label: 'ml-room-create.q-t3-keywords',
            defaultValue: false,
          },
        );
      },
    },
    {
      tag: 'gpt-settings',
      title: 'ml-room-create.q-t4-header',
      active: (answers) =>
        answers.role.value['role-select'] === 'teacher' &&
        answers.general?.value?.gpt,
      buildAction(_injector, _answers, previousState) {
        if (previousState) return previousState;
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
            defaultValue: false,
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
                value: 'students',
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
    {
      tag: 'features',
      title: 'ml-room-create.q-t5-header',
      active: (answers) =>
        answers.role.value['role-select'] === 'teacher' &&
        !answers.event.value.settings,
      buildAction(_injector, _answers, previousState) {
        if (previousState) return previousState;
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
            defaultValue: false,
          },
          {
            type: 'switch',
            tag: 'bonus-archive',
            label: 'ml-room-create.q-t5-bonus-archive',
            defaultValue: false,
          },
          {
            type: 'switch',
            tag: 'brainstorming',
            label: 'ml-room-create.q-t5-brainstorming',
            defaultValue: false,
          },
          {
            type: 'switch',
            tag: 'radar',
            label: 'ml-room-create.q-t5-radar',
            defaultValue: false,
          },
          {
            type: 'switch',
            tag: 'focus',
            label: 'ml-room-create.q-t5-focus',
            defaultValue: false,
          },
        );
      },
    },
  ],
};
