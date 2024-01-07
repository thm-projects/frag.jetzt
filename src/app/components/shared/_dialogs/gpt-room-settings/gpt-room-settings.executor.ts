import { Injector } from "@angular/core";
import { Room } from "app/models/room";
import { Observable, of } from "rxjs";
import { AnsweredMultiLevelData } from "../multi-level-dialog/interface/multi-level-dialog.types";
import { GPTRoomSetting } from "app/models/gpt-room-setting";
import { Data } from "./gpt-room-settings.multi-level";
import { GPTRoomSettingAPI } from "app/services/http/gpt.service";

export const saveSettings = (
    injector: Injector,
    answers: AnsweredMultiLevelData,
    previous: Data,
  ): Observable<GPTRoomSetting> => {
    const allowUsersXY = answers.gptInfo.value['apiCode'];

    const verify = (v: number) => (v ? Math.round(v * 100) : v);
    const patch: Partial<GPTRoomSettingAPI> = {};
    let rights = 0;
    if (answers.canChangeParticipantQuota) {
        rights |= 0x1;
      }
    return of();
  };