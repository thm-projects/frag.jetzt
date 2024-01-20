import { Injector } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AnsweredMultiLevelData } from '../multi-level-dialog/interface/multi-level-dialog.types';
import { GPTRoomSetting } from 'app/models/gpt-room-setting';
import { Data } from './gpt-room-settings.multi-level';
import {
  GPTRoomService,
  PatchRoomSetting,
} from 'app/services/http/gptroom.service';

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
  const patch: Partial<PatchRoomSetting> = {};

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

  
  if (Object.keys(patch).length === 0) return of(previous.GPTSettings);
  return injector.get(GPTRoomService).patchRoomSettings(previous.roomID, patch)
};
