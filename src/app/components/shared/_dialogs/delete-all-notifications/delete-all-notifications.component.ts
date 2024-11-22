import { Component, Inject, OnInit } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TranslateService } from '@ngx-translate/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-delete-all-notifications',
  templateUrl: './delete-all-notifications.component.html',
  styleUrls: ['./delete-all-notifications.component.scss'],
  standalone: false,
})
export class DeleteAllNotificationsComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<DeleteAllNotificationsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: object,
    private liveAnnouncer: LiveAnnouncer,
    private translationService: TranslateService,
  ) {}

  ngOnInit() {
    this.translationService
      .get('delete-notifications.message')
      .subscribe((msg) => {
        this.liveAnnouncer.announce(msg);
      });
  }
}
