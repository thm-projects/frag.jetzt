import { InjectFlags, Injector } from '@angular/core';
import { Room } from 'app/models/room';
import { Observable, forkJoin, of, switchMap } from 'rxjs';
import { AnsweredMultiLevelData } from '../multi-level-dialog/interface/multi-level-dialog.types';
import { GPTRoomSetting, GPTRoomUsageTime } from 'app/models/gpt-room-setting';
import { Data } from './gpt-room-settings.multi-level';
import { GPTRoomSettingAPI, GptService } from 'app/services/http/gpt.service';
import { RoomService } from 'app/services/http/room.service';
import { SessionService } from 'app/services/util/session.service';
import { DialogRef } from '@angular/cdk/dialog';

export const saveSettings = (
  injector: Injector,
  answers: AnsweredMultiLevelData,
  previous: Data,
): Observable<GPTRoomSetting> => {
  // Q1
  const groupGptInfo = answers.gptInfo?.group;
  const groupGptInfoVoucher = answers.gptInfoVoucher?.group;
  const apiKey = groupGptInfo?.value['apiCode'];
  const apiOrg = groupGptInfo?.value['apiOrganization'];
  const apiVoucher = groupGptInfoVoucher?.value['voucher'];

  const test = answers.gptModel;
  console.log(test);

  // Q2
  const groupRoomQuota = answers.roomQuota.group;
  const roomQuota = groupRoomQuota.value['total'];
  const roomQuotaMonthly = groupRoomQuota.value['monthly'];
  const roomQuotaMonthlyFlowing = groupRoomQuota.value['monthlyFlowing'];
  const roomQuotaDaily = groupRoomQuota.value['daily'];

  // Q3
  const groupModeratorQuota = answers.moderatorQuota.group;
  const moderatorQuota = groupModeratorQuota.value['total'];
  const moderatorQuotaMonthly = groupModeratorQuota.value['monthly'];
  const moderatorQuotaMonthlyFlowing =
    groupModeratorQuota.value['monthlyFlowing'];
  const moderatorQuotaDaily = groupModeratorQuota.value['daily'];
  // Q4
  const groupParticipantQuota = answers.participantQuota.group;
  const participantQuota = groupParticipantQuota.value['total'];
  const participantQuotaMonthly = groupParticipantQuota.value['monthly'];
  const participantQuotaMonthlyFlowing =
    groupParticipantQuota.value['monthlyFlowing'];
  const participantQuotaDaily = groupParticipantQuota.value['daily'];

  // Q5

  // Q6
  const groupMiscellaneousSettings = answers.miscellaneousSettings.group;
  const allowUnregisteredUsers =
    groupMiscellaneousSettings.value['allowUnregisteredUsers'];
  const allowAnswerWithoutPreset =
    groupMiscellaneousSettings.value['allowAnswerWithoutPreset'];
  const onlyAnswerWhenCalled =
    groupMiscellaneousSettings.value['onlyAnswerWhenCalled'];

  // Q7
  const groupModeratorPermissions = answers.moderatorPermissions.group;
  const moderatorCanChangeRoomQuota =
    groupModeratorPermissions.value['canChangeRoomQuota'];
  const moderatorCanChangeModeratorQuota =
    groupModeratorPermissions.value['canChangeModeratorQuota'];
  const moderatorCanChangeParticipantQuota =
    groupModeratorPermissions.value['canChangeParticipantQuota'];
  const moderatorCanChangePreset =
    groupModeratorPermissions.value['canChangePreset'];
  const moderatorCanChangeUsageTimes =
    groupModeratorPermissions.value['canChangeUsageTimes'];
  const moderatorCanChangeApiSettings =
    groupModeratorPermissions.value['canChangeApiSettings'];

  const verify = (v: number) => (v ? Math.round(v) : v);
  const patch: Partial<GPTRoomSettingAPI> = {};

  if (apiKey !== previous.GPTSettings.apiKey) {
    patch.apiKey = apiKey;
  }
  if (apiOrg !== previous.GPTSettings.apiOrganization) {
    patch.apiOrganization = apiOrg;
  }
  if (apiVoucher !== previous.GPTSettings.trialCode?.code) {
    /* patch wert existiert nicht */
    console.error('Api Voucher was not patched');
  }

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

  return injector.get(GptService).patchRoomSetting(previous.roomID, patch);
};
