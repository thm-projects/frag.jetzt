import { InjectFlags, Injector } from "@angular/core";
import { Room } from "app/models/room";
import { Observable, of, switchMap } from "rxjs";
import { AnsweredMultiLevelData } from "../multi-level-dialog/interface/multi-level-dialog.types";
import { GPTRoomSetting } from "app/models/gpt-room-setting";
import { Data } from "./gpt-room-settings.multi-level";
import { GPTRoomSettingAPI, GptService } from "app/services/http/gpt.service";
import { RoomService } from "app/services/http/room.service";
import { SessionService } from "app/services/util/session.service";

export const saveSettings = (
    injector: Injector,
    answers: AnsweredMultiLevelData,
    previous: Data,
  ): Observable<GPTRoomSetting> => {
    // Q1
    const apiKey = answers.gptInfo.value['apiCode'];
    const apiOrg = answers.gptInfo.value['apiOrganization'];

    console.log("done with Q1");

    // Q2
    const roomQuota = answers.roomQuota.value['total'];
    const roomQuotaMonthly = answers.roomQuota.value['monthly'];
    const roomQuotaMonthlyFlowing = answers.roomQuota.value['monthlyFlowing'];
    const roomQuotaDaily = answers.roomQuota.value['daily'];

    console.log("done with Q2");

    // Q3
    const moderatorQuota = answers.moderatorQuota.value['total'];
    const moderatorQuotaMonthly = answers.moderatorQuota.value['monthly'];
    const moderatorQuotaMonthlyFlowing = answers.moderatorQuota.value['monthlyFlowing'];
    const moderatorQuotaDaily = answers.moderatorQuota.value['daily'];

    console.log("done with Q3");

    // Q4
    const participantQuota = answers.participantQuota.value['total'];
    const participantQuotaMonthly = answers.participantQuota.value['monthly'];
    const participantQuotaMonthlyFlowing = answers.participantQuota.value['monthlyFlowing'];
    const participantQuotaDaily = answers.participantQuota.value['daily'];

    console.log("done with Q4");

    // Q5

    // Q6
    const allowUnregisteredUsers = answers.miscellaneousSettings.value['allowUnregisteredUsers'];
    const allowAnswerWithoutPreset = answers.miscellaneousSettings.value['allowAnswerWithoutPreset'];
    const onlyAnswerWhenCalled = answers.miscellaneousSettings.value['onlyAnswerWhenCalled'];

    console.log("done with Q6");

    // Q7
    const moderatorCanChangeRoomQuota = answers.moderatorPermissions.value['canChangeRoomQuota'];
    const moderatorCanChangeModeratorQuota = answers.moderatorPermissions.value['canChangeModeratorQuota'];
    const moderatorCanChangeParticipantQuota = answers.moderatorPermissions.value['canChangeParticipantQuota'];
    const moderatorCanChangePreset = answers.moderatorPermissions.value['canChangePreset'];
    const moderatorCanChangeUsageTimes = answers.moderatorPermissions.value['canChangeUsageTimes'];
    const moderatorCanChangeApiSettings = answers.moderatorPermissions.value['canChangeApiSettings'];
    
    console.log("done with Q7");

    const verify = (v: number) => (v ? Math.round(v * 100) : v);
    const patch: Partial<GPTRoomSettingAPI> = {};

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

    patch.rightsBitset = rights;
    patch.apiKey = apiKey;
    patch.apiOrganization = apiOrg;
    patch.maxDailyRoomCost = verify(roomQuotaDaily);
    patch.maxMonthlyRoomCost = verify(roomQuotaMonthly);
    patch.maxMonthlyFlowingRoomCost = verify(roomQuotaMonthlyFlowing);
    patch.maxAccumulatedRoomCost = verify(roomQuota);


    console.log("hier")

    const gptService = injector.get(GptService);

    return gptService.patchRoomSetting(previous.roomID, patch);
  };