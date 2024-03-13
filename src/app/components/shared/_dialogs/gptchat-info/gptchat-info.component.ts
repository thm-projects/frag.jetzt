import { Component, OnInit } from '@angular/core';
import { SessionService } from 'app/services/util/session.service';
import { RoomStateService } from 'app/services/state/room-state.service';
import { takeUntil } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

enum GPTStatusSeverity {
  ERROR = 'ERROR',
  WARNING = 'WARNING',
  INFO = 'INFO',
}

interface GPTStatus {
  key: string;
  severity: GPTStatusSeverity;
}

@Component({
  selector: 'app-gptchat-info',
  templateUrl: './gptchat-info.component.html',
  styleUrls: ['./gptchat-info.component.scss'],
})
export class GPTChatInfoComponent implements OnInit {
  roles = {
    participant: false,
    moderator: false,
    creator: false,
  };

  messageCodesFori18n: GPTStatus[] = [];

  constructor(
    dialogRef: MatDialogRef<GPTChatInfoComponent>,
    private sessionService: SessionService,
    roomStateService: RoomStateService,
  ) {
    roomStateService.assignedRole$
      .pipe(takeUntil(dialogRef.afterClosed()))
      .subscribe((role) => {
        this.roles[role.toLowerCase()] = true;
      });
  }

  static open(dialog: MatDialog) {
    const ref = dialog.open(GPTChatInfoComponent);
    return ref;
  }

  ngOnInit(): void {
    this.sessionService.getGPTStatusOnce().subscribe((status) => {
      const conditionMap = [
        {
          condition: status.globalInfo.blocked,
          key: 'blocked',
          severity: GPTStatusSeverity.ERROR,
        },
        {
          condition:
            !status.globalInfo.blocked &&
            !status.apiKeyPresent &&
            (status.usingTrial ||
              (status.globalInfo.globalActive && status.roomOwnerRegistered)),
          key: 'noGlobalQuotaAvailable',
        },
        {
          condition:
            !status.globalInfo.blocked &&
            !status.apiKeyPresent &&
            !(
              status.usingTrial ||
              (status.globalInfo.globalActive && status.roomOwnerRegistered)
            ),
          key: 'NoApiKey',
        },
        { condition: status.roomDisabled, key: 'roomDisabled' },
        {
          condition: this.roles.moderator && status.moderatorDisabled,
          key: 'moderatorDisabled',
        },
        {
          condition: this.roles.participant && status.participantDisabled,
          key: 'participantDisabled',
        },
        {
          condition: !this.roles.creator && status.usageTimeOver,
          key: 'usageTimeOver',
        },
      ];

      this.messageCodesFori18n = conditionMap
        .filter((condition) => condition.condition)
        .map((condition) => ({
          key: `gptchat-info.${condition.key}`,
          severity: condition.severity || GPTStatusSeverity.WARNING,
        }));
      if (this.messageCodesFori18n.length === 0)
        this.messageCodesFori18n.push({
          key: 'gptchat-info.default',
          severity: GPTStatusSeverity.INFO,
        });

      console.log(this.messageCodesFori18n);
    });
  }
}
