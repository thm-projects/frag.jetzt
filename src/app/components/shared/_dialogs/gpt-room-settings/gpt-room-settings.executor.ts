import { Injector } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { AnsweredMultiLevelData } from '../multi-level-dialog/interface/multi-level-dialog.types';
import { GPTRoomSetting } from 'app/models/gpt-room-setting';
import { Data } from './gpt-room-settings.multi-level';
import {
  GPTRoomService,
  PatchRoomSetting,
} from 'app/services/http/gptroom.service';
import { GPTAPISettingService } from 'app/services/http/gptapisetting.service';

export const saveSettings = (
  injector: Injector,
  answers: AnsweredMultiLevelData,
  previous: Data,
): Observable<GPTRoomSetting> => {
  console.log('1');
  // Q1
  const apiKey = answers.gptInfo?.value['apiCode'];
  const apiOrg = answers.gptInfo?.value['apiOrganization'];
  const apiVoucher = answers.gptInfoVoucher?.value['voucher'];

  console.log('2');
  // Q2
  const roomQuota = answers.roomQuota?.value['total'];
  const roomQuotaMonthly = answers.roomQuota?.value['monthly'];
  const roomQuotaMonthlyFlowing = answers.roomQuota?.value['monthlyFlowing'];
  const roomQuotaDaily = answers.roomQuota?.value['daily'];

  console.log('3');
  // Q3
  const moderatorQuota = answers.moderatorQuota?.value['total'];
  const moderatorQuotaMonthly = answers.moderatorQuota?.value['monthly'];
  const moderatorQuotaMonthlyFlowing =
    answers.moderatorQuota?.value['monthlyFlowing'];
  const moderatorQuotaDaily = answers.moderatorQuota?.value['daily'];

  console.log('4');
  // Q4
  const participantQuota = answers.participantQuota?.value['total'];
  const participantQuotaMonthly = answers.participantQuota?.value['monthly'];
  const participantQuotaMonthlyFlowing =
    answers.participantQuota?.value['monthlyFlowing'];
  const participantQuotaDaily = answers.participantQuota?.value['daily'];

  console.log('5');
  // Q5
  const usageTimes = answers.usageTime?.value;
  console.log(usageTimes);

  console.log('6');
  // Q6
  const allowUnregisteredUsers =
    answers.miscellaneousSettings?.value['allowUnregisteredUsers'];
  const allowAnswerWithoutPreset =
    answers.miscellaneousSettings?.value['allowAnswerWithoutPreset'];
  const onlyAnswerWhenCalled =
    answers.miscellaneousSettings?.value['onlyAnswerWhenCalled'];

  console.log('7');
  // Q7
  const moderatorCanChangeRoomQuota =
    answers.moderatorPermissions?.value['canChangeRoomQuota'];
  const moderatorCanChangeModeratorQuota =
    answers.moderatorPermissions?.value['canChangeModeratorQuota'];
  const moderatorCanChangeParticipantQuota =
    answers.moderatorPermissions?.value['canChangeParticipantQuota'];
  const moderatorCanChangePreset =
    answers.moderatorPermissions?.value['canChangePreset'];
  const moderatorCanChangeUsageTimes =
    answers.moderatorPermissions?.value['canChangeUsageTimes'];
  const moderatorCanChangeApiSettings =
    answers.moderatorPermissions?.value['canChangeApiSettings'];

  const verify = (v: number) => (v ? Math.round(v) : v);
  const patch: Partial<GPTRoomSetting> = {};

  const gptRoomService = injector.get(GPTRoomService);

  if (apiKey !== previous.GPTSettings.apiKeys[0].apiSetting.apiKey) {
    patch.apiKeys[0].apiSetting.apiKey = apiKey;
  }

  if (apiOrg !== previous.GPTSettings.apiKeys[0].apiSetting) {
    patch.apiKeys[0].apiSetting.apiOrganization = apiOrg;
  }

  if (apiVoucher !== previous.GPTSettings.apiKeys[0].voucher.code) {
    patch.apiKeys[0].voucher.code = apiVoucher;
  }

  let patchRoomQuota = of(previous.roomQuota);
  const roomQuotaPatch: Partial<Quota> = {};
  if (roomQuota !== previous.roomQuota.entries.find((e) => e.resetStrategy === 'NEVER').quota) {
    patchRoomQuota = gptRoomService.patchRoomQuota({
      resetStrategy: 'NEVER',
      quota: roomQuota,

    });
  }
  //patchRoomQuota = gptRoomService.patchRoomQuota();

  /* 
  Roomsetting
  -> apiKeys
  -> apiModels
  -> roomQuotaId
  -> part...Id
  -> mod...Id

  GPTKey => GPTRoomKey => RoomSetting


  let cost = verify(roomQuota);
  if (cost !== previous.GPTSettings.maxAccumulatedRoomCost) {
    patch.maxAccumulatedRoomCost = cost;
  }
  cost = verify(roomQuotaMonthly);
  if (cost !== previous.GPTSettings.maxMonthlyRoomCost) {
    patch.maxMonthlyRoomCost = cost;
  }
  cost = verify(roomQuotaMonthlyFlowing);
  if (cost !== previous.GPTSettings.maxMonthlyFlowingRoomCost) {
    patch.maxMonthlyFlowingRoomCost = cost;
  }
  cost = verify(roomQuotaDaily);
  if (cost !== previous.GPTSettings.maxDailyRoomCost) {
    patch.maxDailyRoomCost = cost;
  }
  cost = verify(moderatorQuota);
  if (cost !== previous.GPTSettings.maxAccumulatedModeratorCost) {
    patch.maxAccumulatedModeratorCost = cost;
  }
  cost = verify(moderatorQuotaMonthly);
  if (cost !== previous.GPTSettings.maxMonthlyModeratorCost) {
    patch.maxMonthlyModeratorCost = cost;
  }
  cost = verify(moderatorQuotaMonthlyFlowing);
  if (cost !== previous.GPTSettings.maxMonthlyFlowingModeratorCost) {
    patch.maxMonthlyFlowingModeratorCost = cost;
  }
  cost = verify(moderatorQuotaDaily);
  if (cost !== previous.GPTSettings.maxDailyModeratorCost) {
    patch.maxDailyModeratorCost = cost;
  }
  cost = verify(participantQuota);
  if (cost !== previous.GPTSettings.maxAccumulatedParticipantCost) {
    patch.maxAccumulatedParticipantCost = cost;
  }
  cost = verify(participantQuotaMonthly);
  if (cost !== previous.GPTSettings.maxMonthlyParticipantCost) {
    patch.maxMonthlyParticipantCost = cost;
  }
  cost = verify(participantQuotaMonthlyFlowing);
  if (cost !== previous.GPTSettings.maxMonthlyFlowingParticipantCost) {
    patch.maxMonthlyFlowingParticipantCost = cost;
  }
  cost = verify(participantQuotaDaily);
  if (cost !== previous.GPTSettings.maxDailyParticipantCost) {
    patch.maxDailyParticipantCost = cost;
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

  
  if (Object.keys(patch).length === 0) return of(previous.GPTSettings);*/


  return forkJoin(
    [
      patchRoomQuota,
      // patchModeratorQuota, patchParticipantQuota
      // patchRoomSettings
    ]
  );
};
