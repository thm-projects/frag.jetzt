import { Validators } from '@angular/forms';
import {
  AnsweredMultiLevelData,
  MultiLevelData,
  buildInput,
} from '../multi-level-dialog/interface/multi-level-dialog.types';
import { GptService } from 'app/services/http/gpt.service';
import { GPTRoomSetting } from 'app/models/gpt-room-setting';
import { AccountStateService } from 'app/services/state/account-state.service';
import { filter, first, forkJoin, map, take } from 'rxjs';
import { RoomStateService } from 'app/services/state/room-state.service';
import { Quota, QuotaEntry } from 'app/services/http/quota.service';
import { Injector } from '@angular/core';

export interface Data {
  roomID: string;
  GPTSettings: GPTRoomSetting;
  participantQuota: Quota;
  moderatorQuota: Quota;
  roomQuota: Quota;
}

const convertTo = (qE: QuotaEntry, value = undefined) => {
  if (!qE) return value;
  const temp = qE.quota / 10e7;
  return temp.toFixed(2);
};

export const MULTI_LEVEL_GPT_ROOM_SETTINGS: MultiLevelData<Data> = {
  title: 'ml-gpt-room-settings.title',
  questions: [
    {
      tag: 'gptSetup',
      title: 'ml-gpt-room-settings.gpt-setup-title',
      stepHelp: 'ml-gpt-room-settings.gpt-setup-step-help',
      active: (_answers, injector) => {
        return injector.get(AccountStateService).user$.pipe(
          filter((v) => !!v),
          take(1),
          map((user) => user && !user.isGuest),
        );
      },
      buildAction(_injector, _answers, previousState, data) {
        return buildInput(
          this,
          {
            type: 'text',
            value: 'ml-gpt-room-settings.gpt-setup-item-one-label',
          },
          {
            type: 'radio-select',
            tag: 'setupType',
            label: 'ml-gpt-room-settings.gpt-setup-item-two-label',
            defaultValue:
              previousState?.get('setupType')?.value ??
              data.GPTSettings.apiKeys.some((v) => v.voucherId)
                ? 'apiVoucher'
                : 'apiCode',
            options: [
              {
                value: 'apiCode',
                label: 'ml-gpt-room-settings.gpt-setup-item-two-radio-one',
              },
              {
                value: 'apiVoucher',
                label: 'ml-gpt-room-settings.gpt-setup-item-two-radio-two',
              },
            ],
            validators: [Validators.required],
            errorStates: {
              required:
                'ml-room-create.gpt-setup-item-two-error-label-required',
            },
          },
        );
      },
    },
    {
      tag: 'gptInfo',
      title: 'ml-gpt-room-settings.gpt-info-title',
      stepHelp: 'ml-gpt-room-settings.gpt-info-step-help',
      active: (answers, injector) => {
        return forkJoin([
          injector.get(AccountStateService).user$.pipe(take(1)),
          injector.get(RoomStateService).room$.pipe(take(1)),
        ]).pipe(
          map(([user, room]) => {
            return (
              user?.id === room?.ownerId &&
              answers.gptSetup &&
              answers.gptSetup.group.value.setupType === 'apiCode'
            );
          }),
        );
      },
      buildAction(_injector, _answers, previousState, data) {
        return buildInput(
          this,
          {
            type: 'text',
            value: 'ml-gpt-room-settings.gpt-info-item-one-label',
          },
          {
            type: 'text-input',
            tag: 'apiCode',
            label: 'ml-gpt-room-settings.gpt-info-item-two-label',
            defaultValue: data.GPTSettings.apiKeys[0]?.apiSetting.apiKey,
            hidden: true,
            validators: [
              Validators.required,
              Validators.pattern('sk-[a-zA-Z0-9]+'),
            ],
            errorStates: {
              required:
                'ml-gpt-room-settings.gpt-info-item-two-error-label-required',
              pattern:
                'ml-gpt-room-settings.gpt-info-item-two-error-label-pattern',
            },
          },
          {
            type: 'text-input',
            tag: 'apiOrganization',
            label: 'ml-gpt-room-settings.gpt-info-item-three-label',
            defaultValue:
              data.GPTSettings.apiKeys[0]?.apiSetting.apiOrganization,
            validators: [Validators.pattern('org-[a-zA-Z0-9]+')],
            errorStates: {
              pattern:
                'ml-gpt-room-settings.gpt-info-item-three-error-label-pattern',
            },
          },
        );
      },
    },
    {
      tag: 'gptInfoVoucher',
      title: 'ml-gpt-room-settings.gpt-info-voucher-title',
      stepHelp: 'ml-gpt-room-settings.gpt-info-voucher-step-help',
      active: (answers) =>
        answers.gptSetup &&
        answers.gptSetup.group.value.setupType === 'apiVoucher',
      buildAction(_injector, _answers, previousState, data) {
        return buildInput(
          this,
          {
            type: 'text',
            value: 'ml-gpt-room-settings.gpt-info-voucher-item-one-label',
          },
          {
            type: 'text-input',
            tag: 'voucher',
            defaultValue: data.GPTSettings.apiKeys[0]?.voucher?.code,
            hidden: true,
            label: 'ml-gpt-room-settings.gpt-info-voucher-item-two-label',
            validators: [Validators.required],
            errorStates: {
              required:
                'ml-gpt-room-settings.gpt-info-voucher-item-two-error-label-required',
            },
          },
        );
      },
    },
    {
      tag: 'gptModel',
      title: 'ml-gpt-room-settings.gpt-model-title',
      stepHelp: 'ml-gpt-room-settings.gpt-model-step-help',
      buildAction(_injector, _answers, previousState, data) {
        const options = [];
        _injector
          .get(GptService)
          .getValidModels()
          .subscribe((models) => {
            models.forEach((model) => {
              options.push(model);
            });
          });
        return buildInput(
          this,
          {
            type: 'text',
            value: 'ml-gpt-room-settings.gpt-model-item-one-label',
          },
          {
            type: 'select-input',
            tag: 'model',
            defaultValue:
              previousState?.get('model')?.value ??
              data.GPTSettings.defaultModel,
            label: 'ml-gpt-room-settings.gpt-model-item-two-label',
            options,
          },
        );
      },
    },
    {
      tag: 'roomQuota',
      title: 'ml-gpt-room-settings.room-quota-title',
      stepHelp: 'ml-gpt-room-settings.room-quota-step-help',
      buildAction(_injector, _answers, previousState, data) {
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
              previousState?.get('total')?.value ??
              convertTo(data.roomQuota?.entries[0], 20),
            tag: 'total',
            label: 'ml-gpt-room-settings.room-quota-item-one-label',
          },
          {
            type: 'quota-input',
            allowedRange: {
              min: 0,
              max: 1000,
              step: 0.01,
            },
            defaultValue:
              previousState?.get('monthly')?.value ??
              convertTo(data.roomQuota?.entries[1]),
            tag: 'monthly',
            label: 'ml-gpt-room-settings.room-quota-item-two-label',
          },
          {
            type: 'quota-input',
            allowedRange: {
              min: 0,
              max: 1000,
              step: 0.01,
            },
            defaultValue:
              previousState?.get('monthlyFlowing')?.value ??
              convertTo(data.roomQuota?.entries[2]),
            tag: 'monthlyFlowing',
            label: 'ml-gpt-room-settings.room-quota-item-three-label',
          },
          {
            type: 'quota-input',
            allowedRange: {
              min: 0,
              max: 1000,
              step: 0.01,
            },
            defaultValue:
              previousState?.get('daily')?.value ??
              convertTo(data.roomQuota?.entries[3]),
            tag: 'daily',
            label: 'ml-gpt-room-settings.room-quota-item-four-label',
          },
        );
      },
    },
    {
      tag: 'moderatorQuota',
      title: 'ml-gpt-room-settings.moderator-quota-title',
      stepHelp: 'ml-gpt-room-settings.moderator-quota-step-help',
      active: (answers: AnsweredMultiLevelData, injector: Injector) => {
        return injector.get(RoomStateService).room$.pipe(
          first((room) => Boolean(room)),
          map((room) => room?.mode === 'ARS'),
        );
      },
      buildAction(_injector, _answers, previousState, data) {
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
              previousState?.get('total')?.value ??
              convertTo(data.moderatorQuota?.entries[0], 20),
            tag: 'total',
            label: 'ml-gpt-room-settings.moderator-quota-item-one-label',
          },
          {
            type: 'quota-input',
            allowedRange: {
              min: 0,
              max: 1000,
              step: 0.01,
            },
            defaultValue:
              previousState?.get('monthly')?.value ??
              convertTo(data.moderatorQuota?.entries[1]),
            tag: 'monthly',
            label: 'ml-gpt-room-settings.moderator-quota-item-two-label',
          },
          {
            type: 'quota-input',
            allowedRange: {
              min: 0,
              max: 1000,
              step: 0.01,
            },
            defaultValue:
              previousState?.get('monthlyFlowing')?.value ??
              convertTo(data.moderatorQuota?.entries[2]),
            tag: 'monthlyFlowing',
            label: 'ml-gpt-room-settings.moderator-quota-item-three-label',
          },
          {
            type: 'quota-input',
            allowedRange: {
              min: 0,
              max: 1000,
              step: 0.01,
            },
            defaultValue:
              previousState?.get('daily')?.value ??
              convertTo(data.moderatorQuota?.entries[3]),
            tag: 'daily',
            label: 'ml-gpt-room-settings.moderator-quota-item-four-label',
          },
        );
      },
    },
    {
      tag: 'participantQuota',
      title: 'ml-gpt-room-settings.participant-quota-title',
      stepHelp: 'ml-gpt-room-settings.participant-quota-step-help',
      active: (answers: AnsweredMultiLevelData, injector: Injector) => {
        return injector.get(RoomStateService).room$.pipe(
          filter((v) => !!v),
          take(1),
          map((room) => room?.mode === 'ARS'),
        );
      },
      buildAction(_injector, _answers, previousState, data) {
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
              previousState?.get('total')?.value ??
              convertTo(data.participantQuota?.entries[0], 20),
            tag: 'total',
            label: 'ml-gpt-room-settings.participant-quota-item-one-label',
          },
          {
            type: 'quota-input',
            allowedRange: {
              min: 0,
              max: 1000,
              step: 0.01,
            },
            defaultValue:
              previousState?.get('monthly')?.value ??
              convertTo(data.participantQuota?.entries[1]),
            tag: 'monthly',
            label: 'ml-gpt-room-settings.participant-quota-item-two-label',
          },
          {
            type: 'quota-input',
            allowedRange: {
              min: 0,
              max: 1000,
              step: 0.01,
            },
            defaultValue:
              previousState?.get('monthlyFlowing')?.value ??
              convertTo(data.participantQuota?.entries[2]),
            tag: 'monthlyFlowing',
            label: 'ml-gpt-room-settings.participant-quota-item-three-label',
          },
          {
            type: 'quota-input',
            allowedRange: {
              min: 0,
              max: 1000,
              step: 0.01,
            },
            defaultValue:
              previousState?.get('daily')?.value ??
              convertTo(data.participantQuota?.entries[3]),
            tag: 'daily',
            label: 'ml-gpt-room-settings.participant-quota-item-four-label',
          },
        );
      },
    },
    {
      tag: 'usageTime',
      title: 'ml-gpt-room-settings.usage-time-title',
      stepHelp: 'ml-gpt-room-settings.usage-time-step-help',
      buildAction(_injector, _answers, previousState, data) {
        return buildInput(this, {
          tag: 'usageTimes',
          type: 'date-input',
          defaultValues: data.roomQuota.accessTimes,
          labels: [
            'ml-gpt-room-settings.usage-time-item-one-input',
            'ml-gpt-room-settings.usage-time-item-one-select-one',
            'ml-gpt-room-settings.usage-time-item-one-select-two',
            'ml-gpt-room-settings.usage-time-item-one-select-three',
            'ml-gpt-room-settings.usage-time-item-one-button',
          ],
        });
      },
    },
    {
      tag: 'miscellaneousSettings',
      title: 'ml-gpt-room-settings.miscellaneous-settings-title',
      stepHelp: 'ml-gpt-room-settings.miscellaneous-settings-step-help',
      active: (answers: AnsweredMultiLevelData, injector: Injector) => {
        return injector.get(RoomStateService).room$.pipe(
          filter((v) => !!v),
          take(1),
          map((room) => room?.mode === 'PLE'),
        );
      },
      buildAction(_injector, _answers, previousState, data) {
        return buildInput(
          this,
          {
            type: 'switch',
            tag: 'allowAnswerWithoutPreset',
            defaultValue:
              previousState?.get('allowAnswerWithoutPreset')?.value ??
              data.GPTSettings.disableEnhancedPrompt(),
            label: 'ml-gpt-room-settings.miscellaneous-settings-item-two-label',
          },
          {
            type: 'switch',
            tag: 'onlyAnswerWhenCalled',
            defaultValue:
              previousState?.get('onlyAnswerWhenCalled')?.value ??
              data.GPTSettings.disableForwardMessage(),
            label:
              'ml-gpt-room-settings.miscellaneous-settings-item-three-label',
          },
        );
      },
    },
    {
      tag: 'miscellaneousSettings',
      title: 'ml-gpt-room-settings.miscellaneous-settings-title',
      stepHelp: 'ml-gpt-room-settings.miscellaneous-settings-step-help',
      active: (answers: AnsweredMultiLevelData, injector: Injector) => {
        return injector.get(RoomStateService).room$.pipe(
          filter((v) => !!v),
          take(1),
          map((room) => room?.mode === 'ARS'),
        );
      },
      buildAction(_injector, _answers, previousState, data) {
        return buildInput(
          this,
          {
            type: 'switch',
            tag: 'allowUnregisteredUsers',
            defaultValue:
              previousState?.get('allowUnregisteredUsers')?.value ??
              data.GPTSettings.allowsUnregisteredUsers(),
            label: 'ml-gpt-room-settings.miscellaneous-settings-item-one-label',
          },
          {
            type: 'switch',
            tag: 'allowAnswerWithoutPreset',
            defaultValue:
              previousState?.get('allowAnswerWithoutPreset')?.value ??
              data.GPTSettings.disableEnhancedPrompt(),
            label: 'ml-gpt-room-settings.miscellaneous-settings-item-two-label',
          },
          {
            type: 'switch',
            tag: 'onlyAnswerWhenCalled',
            defaultValue:
              previousState?.get('onlyAnswerWhenCalled')?.value ??
              data.GPTSettings.disableForwardMessage(),
            label:
              'ml-gpt-room-settings.miscellaneous-settings-item-three-label',
          },
        );
      },
    },
    {
      tag: 'moderatorPermissions',
      title: 'ml-gpt-room-settings.moderator-permissions-title',
      stepHelp: 'ml-gpt-room-settings.moderator-permissions-step-help',
      active: (answers: AnsweredMultiLevelData, injector: Injector) => {
        return injector.get(RoomStateService).room$.pipe(
          filter((v) => !!v),
          take(1),
          map((room) => room?.mode === 'ARS'),
        );
      },
      buildAction(_injector, _answers, previousState, data) {
        return buildInput(
          this,
          {
            type: 'switch',
            tag: 'canChangeRoomQuota',
            defaultValue:
              previousState?.get('canChangeRoomQuota')?.value ??
              data.GPTSettings.canChangeRoomQuota(),
            label: 'ml-gpt-room-settings.moderator-permissions-item-one-label',
          },
          {
            type: 'switch',
            tag: 'canChangeModeratorQuota',
            defaultValue:
              previousState?.get('canChangeModeratorQuota')?.value ??
              data.GPTSettings.canChangeModeratorQuota(),
            label: 'ml-gpt-room-settings.moderator-permissions-item-two-label',
          },
          {
            type: 'switch',
            tag: 'canChangeParticipantQuota',
            defaultValue:
              previousState?.get('canChangeParticipantQuota')?.value ??
              data.GPTSettings.canChangeParticipantQuota(),
            label:
              'ml-gpt-room-settings.moderator-permissions-item-three-label',
          },
          {
            type: 'switch',
            tag: 'canChangePreset',
            defaultValue:
              previousState?.get('canChangePreset')?.value ??
              data.GPTSettings.canChangePreset(),
            label: 'ml-gpt-room-settings.moderator-permissions-item-four-label',
          },
          {
            type: 'switch',
            tag: 'canChangeUsageTimes',
            defaultValue:
              previousState?.get('canChangeUsageTimes')?.value ??
              data.GPTSettings.canChangeUsageTimes(),
            label: 'ml-gpt-room-settings.moderator-permissions-item-five-label',
          },
          {
            type: 'switch',
            tag: 'canChangeApiSettings',
            defaultValue:
              previousState?.get('canChangeApiSettings')?.value ??
              data.GPTSettings.canChangeApiSettings(),
            label: 'ml-gpt-room-settings.moderator-permissions-item-six-label',
          },
        );
      },
    },
  ],
};
