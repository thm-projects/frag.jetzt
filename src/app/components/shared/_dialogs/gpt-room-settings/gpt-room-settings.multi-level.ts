import { Validators } from '@angular/forms';
import {
  MultiLevelData,
  buildInput,
} from '../multi-level-dialog/interface/multi-level-dialog.types';
import { GptService } from 'app/services/http/gpt.service';
import { GPTRoomSetting } from 'app/models/gpt-room-setting';
import { AccountStateService } from 'app/services/state/account-state.service';
import { forkJoin, map, merge, take, tap } from 'rxjs';
import { KeycloakRoles, User } from 'app/models/user';
import { UserRole } from 'app/models/user-roles.enum';
import { RoomAccess } from 'app/services/persistence/lg/db-room-acces.model';
import { RoomAccessRole } from 'app/models/client-authentication';
import { RoomStateService } from 'app/services/state/room-state.service';

export interface Data {
  roomID: string;
  GPTSettings: GPTRoomSetting;
}

export const MULTI_LEVEL_GPT_ROOM_SETTINGS: MultiLevelData<Data> = {
  title: 'ml-gpt-room-settings.title',
  questions: [
    {
      tag: 'usageTime',
      title: 'ml-gpt-room-settings.q-periods-of-use',
      stepHelp: 'ml-gpt-room-settings.help.api-title-help',
      buildAction(_injector, _answers, previousState) {
        if (previousState) return previousState;
        return buildInput(this, {
          tag: "test",
          type: 'date-input',
        }
        );
      },
    },
    {
      tag: 'gptSetup',
      title: 'ml-gpt-room-settings.q-api-setup',
      stepHelp: 'ml-gpt-room-settings.help.select-openai-setup',
      active: (_answers, injector) => {
        return injector.get(AccountStateService).user$.pipe(
          take(1),
          map((user) => user && !user.isGuest),
        )
      },
      buildAction(_injector, _answers, previousState, data) {
        if (previousState) return previousState;
        return buildInput(
          this,
          {
            type: 'text',
            value: 'ml-gpt-room-settings.l-api-choice',
          },
          {
            type: 'radio-select',
            tag: 'setupType',
            label: 'ml-gpt-room-settings.r-api-short',
            defaultValue: data.GPTSettings.trialEnabled ? 'apiVoucher' : 'apiCode',
            options: [
              { value: 'apiCode', label: 'ml-gpt-room-settings.r-api-choice-key' },
              { value: 'apiVoucher', label: 'ml-gpt-room-settings.r-api-choice-voucher' },
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
      tag: 'gptInfo',
      title: 'ml-gpt-room-settings.q-api-title',
      stepHelp: 'ml-gpt-room-settings.help.api-title-help',
      active: (answers, injector) => {
        return forkJoin([
          injector.get(AccountStateService).user$.pipe(
            take(1),
          ),
          injector.get(RoomStateService).room$.pipe(
            take(1),
          ),]
        ).pipe(
          map(([user, room]) => {
            return user?.id === room?.ownerId
            && answers.gptSetup && answers.gptSetup.value.setupType === 'apiCode'
          }),
        );
      },
      buildAction(_injector, _answers, previousState, data) {
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
            defaultValue: data.GPTSettings.apiKey,
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
            defaultValue: data.GPTSettings.apiOrganization,
            validators: [Validators.pattern('org-[a-zA-Z0-9]+')],
            errorStates: {
              pattern: 'ml-gpt-room-settings.errors.pattern-api-org',
            },
          },
        );
      },
    },
    {
      tag: 'gptInfoVoucher',
      title: 'ml-gpt-room-settings.q-api-title',
      stepHelp: 'ml-gpt-room-settings.help.api-title-help',
      active: (answers) =>
        answers.gptSetup && answers.gptSetup.value.setupType === 'apiVoucher',
      buildAction(_injector, _answers, previousState, data) {
        return buildInput(
          this,
          {
            type: 'text',
            value: 'ml-gpt-room-settings.q-api-title-2',
          },
          {
            type: 'text-input',
            tag: 'voucher',
            defaultValue: data.GPTSettings.trialCode?.code,
            hidden: true,
            label: 'ml-gpt-room-settings.l-api-voucher',
            validators: [Validators.required],
            errorStates: {
              required: 'ml-room-create.e-p4-required',
            },
          },
        );
      },
    },  
    {
      tag: 'gptModel',
      title: 'ml-gpt-room-settings.q-api-title',
      stepHelp: 'ml-gpt-room-settings.help.api-title-help',
      active: () => false,
      buildAction(_injector, _answers, previousState, data) {
        return buildInput(
          this,
          {
            type: 'text',
            value: 'ml-gpt-room-settings.q-api-title-2',
          },
          {
            type: 'select-input',
            tag: 'model',
            label: 'ml-gpt-room-settings.l-api-voucher',
            options: _injector.get(GptService).getModels(),
            errorStates: {
              required: 'ml-room-create.e-p4-required',
            },
          },
        );
      },
    },
    {
      tag: 'roomQuota',
      title: 'ml-gpt-room-settings.q-room-quota',
      stepHelp: 'ml-gpt-room-settings.help.api-title-help',
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
      stepHelp: 'ml-gpt-room-settings.help.api-title-help',
      active: (answers, injector) => {
        return injector.get(RoomStateService).room$.pipe(
          take(1),
          map((room) => room.mode === 'ARS'),
        )
      },
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
              data.GPTSettings.maxAccumulatedModeratorCost?.toString() || '20',
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
      stepHelp: 'ml-gpt-room-settings.help.api-title-help',
      active: (answers, injector) => {
        return injector.get(RoomStateService).room$.pipe(
          take(1),
          map((room) => room.mode === 'ARS'),
        )
      },
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
              data.GPTSettings.maxAccumulatedParticipantCost?.toString() || '20',
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
      stepHelp: 'ml-gpt-room-settings.help.api-title-help',
      buildAction(_injector, _answers, previousState) {
        if (previousState) return previousState;
        return buildInput(this, {
          tag: "test",
          type: 'date-input',
        }
        );
      },
    },
    {
      tag: 'miscellaneousSettings',
      title: 'ml-gpt-room-settings.q-miscellaneous-settings',
      stepHelp: 'ml-gpt-room-settings.help.api-title-help',
      active: (answers, injector) => {
        return injector.get(RoomStateService).room$.pipe(
          take(1),
          map((room) => room.mode === 'PLE'),
        )
      },
      buildAction(_injector, _answers, previousState, data) {
        if (previousState) return previousState;
        return buildInput(
          this,
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
      tag: 'miscellaneousSettings',
      title: 'ml-gpt-room-settings.q-miscellaneous-settings',
      stepHelp: 'ml-gpt-room-settings.help.api-title-help',
      active: (answers, injector) => {
        return injector.get(RoomStateService).room$.pipe(
          take(1),
          map((room) => room.mode === 'ARS'),
        )
      },
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
      stepHelp: 'ml-gpt-room-settings.help.api-title-help',
      active: (answers, injector) => {
        return injector.get(RoomStateService).room$.pipe(
          take(1),
          map((room) => room.mode === 'ARS'),
        )
      },
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
