import { Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { Motd } from '../../../../models/motd';
import { MotdList } from '../../../../models/motd-list';

@Component({
  selector: 'app-motd-dialog',
  templateUrl: './motd-dialog.component.html',
  styleUrls: ['./motd-dialog.component.scss']
})
export class MotdDialogComponent implements OnInit, OnDestroy {

  public motdsList: MotdList;
  public onClose: EventEmitter<void> = new EventEmitter<void>();

  constructor(
    public dialogRef: MatDialogRef<MotdDialogComponent>,
    private translateService: TranslateService,
    public dialog: MatDialog
  ) { }

  markAllAsRead() {
    this.motdsList.markAllAsRead();
  }

  ngOnInit(): void {
  }

  buildDeclineActionCallback(): () => void {
    return () => this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.onClose.emit();
  }

}
