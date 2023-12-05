import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Room } from 'app/models/room';
import { GPTRoomSetting } from 'app/models/gpt-room-setting';
import { GptService } from 'app/services/http/gpt.service';
import { SessionService } from 'app/services/util/session.service';

@Component({
  selector: 'app-gptchat-info',
  templateUrl: './gptchat-info.component.html',
  styleUrls: ['./gptchat-info.component.scss'],
})

export class GPTChatInfoComponent implements OnInit {

  readonly onCancel = this.cancel.bind(this);

  messageCodesFori18n: string[] = [];

  constructor(private dialogRef: MatDialogRef<GPTChatInfoComponent>,
    private sessionService: SessionService) { }

  static open(dialog: MatDialog) {
    const ref = dialog.open(GPTChatInfoComponent);
    return ref;
  }

  ngOnInit(): void {
    this.sessionService.getGPTStatusOnce().subscribe((status) => {
      const conditionMap = [
        { condition: status.globalInfo.blocked, key: 'blocked' },
        { condition: !status.globalInfo.blocked && status.apiKeyPresent, key: 'noApiKeyNoTrial' },
        {
          condition: !status.globalInfo.blocked &&
            !status.apiKeyPresent &&
            (status.usingTrial || (status.globalInfo.globalActive && status.roomOwnerRegistered)), key: 'noGlobalQuotaAvailable'
        },
        { condition: !status.globalInfo.blocked && !status.apiKeyPresent && !(status.usingTrial || (status.globalInfo.globalActive && status.roomOwnerRegistered)), key: 'noApiKeyNoGlobalQuota' },
        { condition: status.roomDisabled, key: 'roomDisabled' },
        { condition: status.isMod && status.moderatorDisabled, key: 'moderatorDisabled' },
        { condition: !status.isMod && !status.isOwner && status.participantDisabled, key: 'participantDisabled' },
        { condition: !status.isOwner && status.usageTimeOver, key: 'usageTimeOver' },
      ];
      
      this.messageCodesFori18n = conditionMap.filter(condition => condition.condition).map(condition => `gptchat-info.${condition.key}`);
      if (this.messageCodesFori18n.length === 0) this.messageCodesFori18n.push('gptchat-info.default');
    });
  }


  private cancel() {
    this.dialogRef.close();
  }
}
