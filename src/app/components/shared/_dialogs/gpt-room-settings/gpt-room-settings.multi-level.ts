import { Validators } from '@angular/forms';
import {
  MultiLevelData,
  buildInput,
} from '../multi-level-dialog/interface/multi-level-dialog.types';

export const MULTI_LEVEL_GPT_ROOM_SETTINGS: MultiLevelData = {
  title: 'ml-gpt-room-settings.title',
  questions: [
    {
      tag: 'gptInfo',
      title: 'ml-gpt-room-settings.q-api-title',
      stepHelp: 'ml-gpt-room-settings.help.api-title-help',
      buildAction(_injector, _answers, previousState) {
        if (previousState) return previousState;
        return buildInput(
          this,
          {
            type: 'text',
            value: 'ml-gpt-room-settings.q-api-title',
          },
          {
            type: 'text-input',
            tag: 'apiCode',
            label: 'ml-gpt-room-settings.l-api-code',
            hidden: true,
            validators: [
              Validators.required,
              Validators.pattern('sk-[a-zA-Z0-9]+'),
            ],
            errorStates: {
              required: 'ml-gpt-room-settings.errors.required-api-code',
              pattern: 'ml-gpt-room-settings.errors.pattern-api-code',
            },
          },
          {
            type: 'text-input',
            tag: 'apiOrganization',
            label: 'ml-gpt-room-settings.l-api-org',
            validators: [Validators.pattern('org-[a-zA-Z0-9]+')],
            errorStates: {
              pattern: 'ml-gpt-room-settings.errors.pattern-api-org',
            },
          },
        );
      },
    },
    {
      tag: 'gptInfo',
      title: 'ml-gpt-room-settings.q-api-title',
      buildAction(_injector, _answers, previousState) {
        if (previousState) return previousState;
        return buildInput(this, {
          type: 'text',
          value: 'Hallo Welt',
        });
      },
    },
    {
      tag: 'gptInfo',
      title: 'ml-gpt-room-settings.q-api-title',
      buildAction(_injector, _answers, previousState) {
        if (previousState) return previousState;
        return buildInput(this, {
          type: 'text',
          value: 'Hallo Welt',
        });
      },
    },
    {
      tag: 'gptInfo',
      title: 'ml-gpt-room-settings.q-api-title',
      buildAction(_injector, _answers, previousState) {
        if (previousState) return previousState;
        return buildInput(this, {
          type: 'text',
          value: 'Hallo Welt',
        });
      },
    },
    {
      tag: 'gptInfo',
      title: 'ml-gpt-room-settings.q-api-title',
      buildAction(_injector, _answers, previousState) {
        if (previousState) return previousState;
        return buildInput(this, {
          type: 'text',
          value: 'Hallo Welt',
        });
      },
    },
    {
      tag: 'gptInfo',
      title: 'ml-gpt-room-settings.q-api-title',
      buildAction(_injector, _answers, previousState) {
        if (previousState) return previousState;
        return buildInput(this, {
          type: 'text',
          value: 'Hallo Welt',
        });
      },
    },
  ],
};
