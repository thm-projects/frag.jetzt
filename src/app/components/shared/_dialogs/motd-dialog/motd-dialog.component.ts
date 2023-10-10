import { Component, Input, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MotdAPI } from '../../../../services/http/motd.service';
import { Motd } from '../../../../models/motd';
import { AccountStateService } from 'app/services/state/account-state.service';
import { filter, take } from 'rxjs';

@Component({
  selector: 'app-motd-dialog',
  templateUrl: './motd-dialog.component.html',
  styleUrls: ['./motd-dialog.component.scss'],
})
export class MotdDialogComponent implements OnInit {
  @Input()
  motds: MotdAPI[];
  builtMotds: Motd[];

  constructor(
    public dialogRef: MatDialogRef<MotdDialogComponent>,
    private accountState: AccountStateService,
  ) {}

  markAllAsRead() {
    const newRead = this.builtMotds.reduce((acc, value) => {
      if (!value.isRead) {
        value.isRead = true;
        acc.push(value.id);
      }
      return acc;
    }, []);
    this.accountState.readMotds(newRead);
    this.dialogRef.close();
  }

  ngOnInit(): void {
    this.accountState.readMotds$
      .pipe(
        filter((v) => Boolean(v)),
        take(1),
      )
      .subscribe((read) => {
        this.builtMotds = this.motds.map((motd) => {
          return new Motd(
            motd.id,
            motd.startTimestamp,
            motd.endTimestamp,
            read.findIndex((v) => v.motdId === motd.id) >= 0,
            motd.messages,
          );
        });
      });
  }

  buildDeclineActionCallback(): () => void {
    return () => this.dialogRef.close();
  }
}
