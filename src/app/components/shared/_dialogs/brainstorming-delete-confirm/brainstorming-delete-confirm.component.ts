import { DialogRef } from '@angular/cdk/dialog';
import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BrainstormingService } from 'app/services/http/brainstorming.service';
import { NotificationService } from 'app/services/util/notification.service';

@Component({
  selector: 'app-brainstorming-delete-confirm',
  templateUrl: './brainstorming-delete-confirm.component.html',
  styleUrls: ['./brainstorming-delete-confirm.component.scss'],
})
export class BrainstormingDeleteConfirmComponent {
  @Input()
  type: 'rating' | 'category' = 'rating';
  @Input()
  sessionId: string;

  constructor(
    private dialogRef: DialogRef<boolean>,
    private brainstormingService: BrainstormingService,
    private translateService: TranslateService,
    private notificationService: NotificationService,
  ) {}

  protected save() {
    this.dialogRef.close(true);
    if (this.type === 'rating') {
      this.brainstormingService.deleteAllVotes(this.sessionId).subscribe({
        next: () => {
          this.translateService
            .get('room-page.changes-successful')
            .subscribe((msg) => {
              this.notificationService.show(msg);
            });
        },
        error: () => {
          this.translateService
            .get('room-page.changes-gone-wrong')
            .subscribe((msg) => {
              this.notificationService.show(msg);
            });
        },
      });
    } else {
      this.brainstormingService
        .deleteAllCategoryAssignments(this.sessionId)
        .subscribe({
          next: () => {
            this.translateService
              .get('room-page.changes-successful')
              .subscribe((msg) => {
                this.notificationService.show(msg);
              });
          },
          error: () => {
            this.translateService
              .get('room-page.changes-gone-wrong')
              .subscribe((msg) => {
                this.notificationService.show(msg);
              });
          },
        });
    }
  }
}
