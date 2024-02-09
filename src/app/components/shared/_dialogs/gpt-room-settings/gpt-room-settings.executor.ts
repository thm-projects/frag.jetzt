import { Injector } from '@angular/core';
import { Observable, concatMap, forkJoin, map, of } from 'rxjs';
import { AnsweredMultiLevelData } from '../multi-level-dialog/interface/multi-level-dialog.types';
import { GPTRoomKey, GPTRoomSetting } from 'app/models/gpt-room-setting';
import { Data } from './gpt-room-settings.multi-level';
import { GPTRoomService } from 'app/services/http/gptroom.service';
import {
  Quota,
  QuotaAccessTime,
  QuotaEntry,
  QuotaResetStrategy,
} from 'app/services/http/quota.service';
import { GPTAPISettingService } from 'app/services/http/gptapisetting.service';
import { GPTVoucherService } from 'app/services/http/gptvoucher.service';
import { UNITS } from '../multi-level-dialog/multi-level-date-input/multi-level-date-input.component';

/**
 * @param value in US $ as float or null
 */
const checkEntry = (
  patch: Partial<Quota>,
  current: Quota,
  key: QuotaResetStrategy,
  value: number,
) => {
  if (value !== 0 && !value) return;
  const entry = current.entries.find((e) => e.resetStrategy === key);
  patch.entries.push(
    new QuotaEntry({
      resetStrategy: key,
      resetFactor: 1,
      quota: Math.round(value * 10 ** 8),
      counter: entry?.counter ?? 0,
      resetCounter: entry?.resetCounter ?? 0,
      lastReset: entry?.lastReset ?? new Date(),
      startDate: null,
      endDate: null,
    }),
  );
};

const userOwnsModel = (requestedModel, models) =>
  models.some((element) => element.name === requestedModel);

export const saveSettings = (
  injector: Injector,
  answers: AnsweredMultiLevelData,
  previous: Data,
): Observable<GPTRoomSetting> => {
  // Start of destructuring
  // Q1
  const groupGptInfo = answers['gptInfo']?.group;
  const groupGptInfoVoucher = answers['gptInfoVoucher']?.group;
  const apiKey = groupGptInfo?.value['apiCode'];
  const apiOrg = groupGptInfo?.value['apiOrganization'];
  const apiVoucher = groupGptInfoVoucher?.value['voucher'];

  // Q2
  const groupRoomQuota = answers['roomQuota']?.group;
  const roomQuota = groupRoomQuota?.value['total'];
  const roomQuotaMonthly = groupRoomQuota?.value['monthly'];
  const roomQuotaMonthlyFlowing = groupRoomQuota?.value['monthlyFlowing'];
  const roomQuotaDaily = groupRoomQuota?.value['daily'];

  // gpt-model
  const gptModel = answers['gptModel']?.group?.value['model'];

  // Q3
  const groupModeratorQuota = answers['moderatorQuota']?.group;
  const moderatorQuota = groupModeratorQuota?.value['total'];
  const moderatorQuotaMonthly = groupModeratorQuota?.value['monthly'];
  const moderatorQuotaMonthlyFlowing =
    groupModeratorQuota?.value['monthlyFlowing'];
  const moderatorQuotaDaily = groupModeratorQuota?.value['daily'];
  // Q4
  const groupParticipantQuota = answers['participantQuota']?.group;
  const participantQuota = groupParticipantQuota?.value['total'];
  const participantQuotaMonthly = groupParticipantQuota?.value['monthly'];
  const participantQuotaMonthlyFlowing =
    groupParticipantQuota?.value['monthlyFlowing'];
  const participantQuotaDaily = groupParticipantQuota?.value['daily'];

  // Q5
  const usageTimes = answers['usageTime']?.group?.value['usageTimes'];

  // Q6
  const groupMiscellaneousSettings = answers['miscellaneousSettings']?.group;
  const allowUnregisteredUsers =
    groupMiscellaneousSettings?.value['allowUnregisteredUsers'];
  const allowAnswerWithoutPreset =
    groupMiscellaneousSettings?.value['allowAnswerWithoutPreset'];
  const onlyAnswerWhenCalled =
    groupMiscellaneousSettings?.value['onlyAnswerWhenCalled'];

  // Q7
  const groupModeratorPermissions = answers['moderatorPermissions']?.group;
  const moderatorCanChangeRoomQuota =
    groupModeratorPermissions?.value['canChangeRoomQuota'];
  const moderatorCanChangeModeratorQuota =
    groupModeratorPermissions?.value['canChangeModeratorQuota'];
  const moderatorCanChangeParticipantQuota =
    groupModeratorPermissions?.value['canChangeParticipantQuota'];
  const moderatorCanChangePreset =
    groupModeratorPermissions?.value['canChangePreset'];
  const moderatorCanChangeUsageTimes =
    groupModeratorPermissions?.value['canChangeUsageTimes'];
  const moderatorCanChangeApiSettings =
    groupModeratorPermissions?.value['canChangeApiSettings'];

  // Start of patching

  const patch: Partial<GPTRoomSetting> = {};

  const gptRoomService = injector.get(GPTRoomService);
  const gptApiService = injector.get(GPTAPISettingService);
  const gptVoucher = injector.get(GPTVoucherService);

  const previousApi = previous.GPTSettings.apiKeys[0]?.apiSetting;

  let before: Observable<unknown> = of(null);
  if (
    apiKey !== previousApi?.apiKey ||
    apiOrg !== previousApi?.apiOrganization
  ) {
    before = gptApiService
      .create({
        apiKey,
        apiOrganization: apiOrg,
      })
      .pipe(
        map((api) => {
          patch.apiKeys = [
            new GPTRoomKey({
              apiSettingId: api.id,
              voucherId: null,
            }),
          ];
        }),
      );
  }

  const previousVoucher = previous.GPTSettings.apiKeys[0]?.voucher;

  if (apiVoucher !== previousVoucher?.code) {
    before = gptVoucher.claim(apiVoucher).pipe(
      map((v) => {
        patch.apiKeys = [
          new GPTRoomKey({
            apiSettingId: null,
            voucherId: v.id,
          }),
        ];
      }),
    );
  }

  let patchRoomQuota = of(previous.roomQuota);
  const roomQuotaPatch: Partial<Quota> = { entries: [] };
  checkEntry(roomQuotaPatch, previous.roomQuota, 'DAILY', roomQuotaDaily);
  checkEntry(roomQuotaPatch, previous.roomQuota, 'MONTHLY', roomQuotaMonthly);
  checkEntry(
    roomQuotaPatch,
    previous.roomQuota,
    'MONTHLY_FLOWING',
    roomQuotaMonthlyFlowing,
  );
  checkEntry(roomQuotaPatch, previous.roomQuota, 'NEVER', roomQuota);

  roomQuotaPatch.accessTimes = [];

  if (usageTimes && usageTimes.length > 0) {
    usageTimes.forEach((element) => {
      let repeatUnit = element.repeatUnit;
      if (typeof repeatUnit === 'number') {
        repeatUnit = UNITS[repeatUnit];
      }
      const { hour, minute } = element.startDuration;
      const startTime: [number, number] = [hour, minute];
      const { hour: hour2, minute: minute2 } = element.endDuration;
      const endTime: [number, number] = [hour2, minute2];
      roomQuotaPatch.accessTimes.push(
        new QuotaAccessTime({
          startDate: element.startDate,
          endDate: element.endDate,
          recurringStrategy: 'WEEKLY',
          recurringFactor: 1,
          strategy: repeatUnit,
          startTime,
          endTime,
        }),
      );
    });
  }

  if (
    roomQuotaPatch.entries.length > 0 ||
    roomQuotaPatch.accessTimes.length > 0
  ) {
    patchRoomQuota = gptRoomService.patchRoomQuota(
      previous.GPTSettings.roomId,
      previous.roomQuota.id,
      roomQuotaPatch,
    );
  }

  let patchModeratorQuota = of(previous.moderatorQuota);
  const moderatorQuotaPatch: Partial<Quota> = { entries: [] };
  checkEntry(
    moderatorQuotaPatch,
    previous.moderatorQuota,
    'DAILY',
    moderatorQuotaDaily,
  );
  checkEntry(
    moderatorQuotaPatch,
    previous.moderatorQuota,
    'MONTHLY',
    moderatorQuotaMonthly,
  );
  checkEntry(
    moderatorQuotaPatch,
    previous.moderatorQuota,
    'MONTHLY_FLOWING',
    moderatorQuotaMonthlyFlowing,
  );
  checkEntry(
    moderatorQuotaPatch,
    previous.moderatorQuota,
    'NEVER',
    moderatorQuota,
  );
  if (moderatorQuotaPatch.entries.length > 0) {
    patchModeratorQuota = gptRoomService.patchModeratorQuota(
      previous.GPTSettings.roomId,
      previous.moderatorQuota.id,
      moderatorQuotaPatch,
    );
  }

  let patchParticipantQuota = of(previous.participantQuota);
  const participantQuotaPatch: Partial<Quota> = { entries: [] };
  checkEntry(
    participantQuotaPatch,
    previous.participantQuota,
    'DAILY',
    participantQuotaDaily,
  );
  checkEntry(
    participantQuotaPatch,
    previous.participantQuota,
    'MONTHLY',
    participantQuotaMonthly,
  );
  checkEntry(
    participantQuotaPatch,
    previous.participantQuota,
    'MONTHLY_FLOWING',
    participantQuotaMonthlyFlowing,
  );
  checkEntry(
    participantQuotaPatch,
    previous.participantQuota,
    'NEVER',
    participantQuota,
  );
  if (participantQuotaPatch.entries.length > 0) {
    patchParticipantQuota = gptRoomService.patchParticipantQuota(
      previous.GPTSettings.roomId,
      previous.participantQuota.id,
      participantQuotaPatch,
    );
  }

  /*
  Roomsetting
  -> apiKeys
  -> apiModels
  -> roomQuotaId
  -> part...Id
  -> mod...Id

  GPTAPIKey oder GPTVoucher => GPTRoomKey => RoomSetting

*/

  if (previous.GPTSettings.defaultModel !== gptModel) {
    patch.defaultModel = gptModel;
  }

  const userOwnsRequestedModel = userOwnsModel(
    gptModel,
    previous.GPTSettings.apiModels,
  );
  if (userOwnsRequestedModel) {
    patch.defaultModel = gptModel;
  }

  let rights = 0;
  if (moderatorCanChangeParticipantQuota) {
    rights |= 0x1;
  }
  if (moderatorCanChangeModeratorQuota) {
    rights |= 0x1 << 1;
  }
  if (moderatorCanChangeRoomQuota) {
    rights |= 0x1 << 2;
  }
  if (moderatorCanChangePreset) {
    rights |= 0x1 << 3;
  }
  if (moderatorCanChangeUsageTimes) {
    rights |= 0x1 << 4;
  }
  if (moderatorCanChangeApiSettings) {
    rights |= 0x1 << 5;
  }
  if (allowUnregisteredUsers) {
    rights |= 0x1 << 6;
  }
  if (allowAnswerWithoutPreset) {
    rights |= 0x1 << 7;
  }
  if (onlyAnswerWhenCalled) {
    rights |= 0x1 << 8;
  }

  if (rights !== previous.GPTSettings.rightsBitset) {
    patch.rightsBitset = rights;
  }

  // submit patch

  return before.pipe(
    concatMap(() =>
      forkJoin([
        patchRoomQuota,
        patchModeratorQuota,
        patchParticipantQuota,
        Object.keys(patch).length === 0
          ? of(previous.GPTSettings)
          : gptRoomService.patchRoomSettings(
              previous.GPTSettings.roomId,
              patch,
            ),
      ]),
    ),
    map((arr) => arr[3]),
  );
};
