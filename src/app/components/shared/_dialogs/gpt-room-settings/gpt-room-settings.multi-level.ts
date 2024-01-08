import { Validators } from '@angular/forms';
import {
  MultiLevelData,
  buildInput,
} from '../multi-level-dialog/interface/multi-level-dialog.types';
import { GptService } from 'app/services/http/gpt.service';
import { GPTRoomSetting } from 'app/models/gpt-room-setting';

export interface Data {
  roomID: string;
  GPTSettings: GPTRoomSetting;
}

export const MULTI_LEVEL_GPT_ROOM_SETTINGS: MultiLevelData<Data> = {
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
              //Validators.required,
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
      tag: 'roomQuota',
      title: 'ml-gpt-room-settings.q-room-quota',
      buildAction(_injector, _answers, previousState, data) {
        console.log(_answers);
        if (previousState) return previousState;
        return buildInput(
          this,
          {
            type: 'quota-input',
            allowedRange: {
              min: 0,
              max: 1000,
              step: 0.01,
            },
            defaultValue:
              data.GPTSettings.maxAccumulatedRoomCost?.toString() || '20',
            tag: 'total',
            label: 'ml-gpt-room-settings.l-total-cost-limit',
          },
          {
            type: 'quota-input',
            allowedRange: {
              min: 0,
              max: 1000,
              step: 0.01,
            },
            defaultValue: data.GPTSettings.maxMonthlyRoomCost?.toString(),
            tag: 'monthly',
            label: 'ml-gpt-room-settings.l-monthly-cost-limit',
          },
          {
            type: 'quota-input',
            allowedRange: {
              min: 0,
              max: 1000,
              step: 0.01,
            },
            defaultValue:
              data.GPTSettings.maxMonthlyFlowingRoomCost?.toString(),
            tag: 'monthlyFlowing',
            label: 'ml-gpt-room-settings.l-monthly-flowing-cost-limit',
          },
          {
            type: 'quota-input',
            allowedRange: {
              min: 0,
              max: 1000,
              step: 0.01,
            },
            defaultValue: data.GPTSettings.maxDailyRoomCost?.toString(),
            tag: 'daily',
            label: 'ml-gpt-room-settings.l-daily-cost-limit',
          },
        );
      },
    },
    {
      tag: 'moderatorQuota',
      title: 'ml-gpt-room-settings.q-moderator-quota',
      buildAction(_injector, _answers, previousState, data) {
        if (previousState) return previousState;
        return buildInput(
          this,
          {
            type: 'quota-input',
            allowedRange: {
              min: 0,
              max: 1000,
              step: 0.01,
            },
            defaultValue:
              data.GPTSettings.maxAccumulatedModeratorCost?.toString(),
            tag: 'total',
            label: 'ml-gpt-room-settings.l-total-cost-limit',
          },
          {
            type: 'quota-input',
            allowedRange: {
              min: 0,
              max: 1000,
              step: 0.01,
            },
            defaultValue: data.GPTSettings.maxMonthlyModeratorCost?.toString(),
            tag: 'monthly',
            label: 'ml-gpt-room-settings.l-monthly-cost-limit',
          },
          {
            type: 'quota-input',
            allowedRange: {
              min: 0,
              max: 1000,
              step: 0.01,
            },
            defaultValue:
              data.GPTSettings.maxMonthlyFlowingModeratorCost?.toString(),
            tag: 'monthlyFlowing',
            label: 'ml-gpt-room-settings.l-monthly-flowing-cost-limit',
          },
          {
            type: 'quota-input',
            allowedRange: {
              min: 0,
              max: 1000,
              step: 0.01,
            },
            defaultValue: data.GPTSettings.maxDailyModeratorCost?.toString(),
            tag: 'daily',
            label: 'ml-gpt-room-settings.l-daily-cost-limit',
          },
        );
      },
    },
    {
      tag: 'participantQuota',
      title: 'ml-gpt-room-settings.q-participant-quota',
      buildAction(_injector, _answers, previousState, data) {
        if (previousState) return previousState;
        return buildInput(
          this,
          {
            type: 'quota-input',
            allowedRange: {
              min: 0,
              max: 1000,
              step: 0.01,
            },
            defaultValue:
              data.GPTSettings.maxAccumulatedParticipantCost?.toString(),
            tag: 'total',
            label: 'ml-gpt-room-settings.l-total-cost-limit',
          },
          {
            type: 'quota-input',
            allowedRange: {
              min: 0,
              max: 1000,
              step: 0.01,
            },
            defaultValue:
              data.GPTSettings.maxMonthlyParticipantCost?.toString(),
            tag: 'monthly',
            label: 'ml-gpt-room-settings.l-monthly-cost-limit',
          },
          {
            type: 'quota-input',
            allowedRange: {
              min: 0,
              max: 1000,
              step: 0.01,
            },
            defaultValue:
              data.GPTSettings.maxMonthlyFlowingParticipantCost?.toString(),
            tag: 'monthlyFlowing',
            label: 'ml-gpt-room-settings.l-monthly-flowing-cost-limit',
          },
          {
            type: 'quota-input',
            allowedRange: {
              min: 0,
              max: 1000,
              step: 0.01,
            },
            defaultValue: data.GPTSettings.maxDailyParticipantCost?.toString(),
            tag: 'daily',
            label: 'ml-gpt-room-settings.l-daily-cost-limit',
          },
        );
      },
    },
    {
      tag: 'usageTime',
      title: 'ml-gpt-room-settings.q-periods-of-use',
      buildAction(_injector, _answers, previousState) {
        if (previousState) return previousState;
        return buildInput(this, {
          type: 'text',
          value: 'Hallo Welt',
        });
      },
    },
    {
      tag: 'miscellaneousSettings',
      title: 'ml-gpt-room-settings.q-miscellaneous-settings',
      buildAction(_injector, _answers, previousState, data) {
        if (previousState) return previousState;
        return buildInput(
          this,
          {
            type: 'switch',
            tag: 'allowUnregisteredUsers',
            defaultValue: data.GPTSettings.allowsUnregisteredUsers(),
            label: 'ml-gpt-room-settings.s-allow-unregistered-users',
          },
          {
            type: 'switch',
            defaultValue: data.GPTSettings.disableEnhancedPrompt(),
            tag: 'allowAnswerWithoutPreset',
            label: 'ml-gpt-room-settings.s-allow-answer-without-preset',
          },
          {
            type: 'switch',
            defaultValue: data.GPTSettings.disableForwardMessage(),
            tag: 'onlyAnswerWhenCalled',
            label: 'ml-gpt-room-settings.s-only-answer-when-called',
          },
        );
      },
    },
    {
      tag: 'moderatorPermissions',
      title: 'ml-gpt-room-settings.q-moderator-permissions',
      buildAction(_injector, _answers, previousState, data) {
        if (previousState) return previousState;
        return buildInput(
          this,
          {
            type: 'switch',
            tag: 'canChangeRoomQuota',
            defaultValue: data.GPTSettings.canChangeRoomQuota(),
            label:
              'ml-gpt-room-settings.s-moderator-can-change-participant-quota',
          },
          {
            type: 'switch',
            tag: 'canChangeModeratorQuota',
            defaultValue: data.GPTSettings.canChangeModeratorQuota(),
            label:
              'ml-gpt-room-settings.s-moderator-can-change-moderator-quota',
          },
          {
            type: 'switch',
            tag: 'canChangeParticipantQuota',
            defaultValue: data.GPTSettings.canChangeParticipantQuota(),
            label: 'ml-gpt-room-settings.s-moderator-can-change-room-quota',
          },
          {
            type: 'switch',
            tag: 'canChangePreset',
            defaultValue: data.GPTSettings.canChangePreset(),
            label: 'ml-gpt-room-settings.s-moderator-can-change-prompt-presets',
          },
          {
            type: 'switch',
            tag: 'canChangeUsageTimes',
            defaultValue: data.GPTSettings.canChangeUsageTimes(),
            label: 'ml-gpt-room-settings.s-moderator-can-change-periods-of-use',
          },
          {
            type: 'switch',
            tag: 'canChangeApiSettings',
            defaultValue: data.GPTSettings.canChangeApiSettings(),
            label: 'ml-gpt-room-settings.s-moderator-can-change-api-settings',
          },
        );
      },
    },
  ],
};
