import { Component, Input, OnInit } from '@angular/core';
import { MotdAPI } from '../../../../services/http/motd.service';
import { Motd } from '../../../../models/motd';
import { AccountStateService } from 'app/services/state/account-state.service';
import { first } from 'rxjs';
import { verifyInstance } from 'app/utils/ts-utils';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-motd-dialog',
  templateUrl: './motd-dialog.component.html',
  styleUrls: ['./motd-dialog.component.scss'],
  standalone: false,
})
export class MotdDialogComponent implements OnInit {
  @Input()
  motds: MotdAPI[];
  unreadMotds: Motd[];
  readMotds: Motd[];

  constructor(
    public dialogRef: MatDialogRef<MotdDialogComponent>,
    private accountState: AccountStateService,
  ) {}

  onSwitch(motd: Motd) {
    const indexRead = this.readMotds.indexOf(motd);
    if (indexRead >= 0) {
      this.readMotds.splice(indexRead, 1);
    }
    const indexUnread = this.unreadMotds.indexOf(motd);
    if (indexUnread >= 0) {
      this.unreadMotds.splice(indexUnread, 1);
    }
    if (motd.isRead) {
      this.accountState.readMotds([motd.id]);
      this.readMotds.push(motd);
      this.sort(this.readMotds);
    } else {
      this.accountState.unreadMotd(motd.id);
      this.unreadMotds.push(motd);
      this.sort(this.unreadMotds);
    }
  }

  markAllAsRead() {
    const newRead = this.unreadMotds.reduce((acc, value) => {
      value.isRead = true;
      acc.push(value.id);
      return acc;
    }, []);
    this.accountState.readMotds(newRead);
    this.dialogRef.close();
  }

  ngOnInit(): void {
    this.accountState.readMotds$
      .pipe(first((v) => Boolean(v)))
      .subscribe((read) => {
        const motds = this.motds.map((motd) => {
          return new Motd(
            motd.id,
            verifyInstance(Date, motd.startTimestamp),
            verifyInstance(Date, motd.endTimestamp),
            read.findIndex((v) => v.motdId === motd.id) >= 0,
            motd.messages,
          );
        });
        this.sort(motds);
        this.unreadMotds = motds.filter((e) => !e.isRead);
        this.readMotds = motds.filter((e) => e.isRead);
      });
  }

  private sort(motds: Motd[]) {
    motds.sort(
      (a, b) => b.startTimestamp.getTime() - a.startTimestamp.getTime(),
    );
  }
}
