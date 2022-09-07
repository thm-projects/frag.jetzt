import { Component, Input, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MotdAPI } from '../../../../services/http/motd.service';
import { Motd } from '../../../../models/motd';
import { UserManagementService } from '../../../../services/util/user-management.service';
import { StartUpService } from '../../../../services/util/start-up.service';

@Component({
  selector: 'app-motd-dialog',
  templateUrl: './motd-dialog.component.html',
  styleUrls: ['./motd-dialog.component.scss']
})
export class MotdDialogComponent implements OnInit {

  @Input()
  motds: MotdAPI[];
  builtMotds: Motd[];

  constructor(
    public dialogRef: MatDialogRef<MotdDialogComponent>,
    private userManagementService: UserManagementService,
    private startUpService: StartUpService,
  ) {
  }

  markAllAsRead() {
    const newRead = this.builtMotds.reduce((acc, value) => {
      if (!value.isRead) {
        value.isRead = true;
        acc.push(value.id);
      }
      return acc;
    }, []);
    this.startUpService.readMOTD(newRead);
  }

  ngOnInit(): void {
    const read = this.userManagementService.getCurrentUser().readMotds;
    this.builtMotds = this.motds.map(motd => {
      return new Motd(
        motd.id,
        motd.startTimestamp,
        motd.endTimestamp,
        read.has(motd.id),
        motd.messages,
      );
    });
  }

  buildDeclineActionCallback(): () => void {
    return () => this.dialogRef.close();
  }

}
