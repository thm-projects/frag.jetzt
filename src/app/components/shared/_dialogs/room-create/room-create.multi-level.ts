import { Validators } from '@angular/forms';
import {
  MultiLevelData,
  buildInput,
} from '../multi-level-dialog/interface/multi-level-dialog.types';

export const MULTI_LEVEL_ROOM_CREATE: MultiLevelData = {
  title: 'ml-room-create.title',
  buttonSection: 'ml-room-create',
  confirmKey: 'create',
  questions: [
    {
      tag: 'role',
      title: 'ml-room-create.q-1-header',
      buildAction() {
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
      buildAction() {
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
  ],
};
