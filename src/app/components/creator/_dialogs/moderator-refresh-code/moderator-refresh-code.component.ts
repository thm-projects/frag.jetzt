import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-moderator-refresh-code',
  templateUrl: './moderator-refresh-code.component.html',
  styleUrls: ['./moderator-refresh-code.component.scss']
})
export class ModeratorRefreshCodeComponent implements OnInit {

  constructor(
    private dialogRef: MatDialogRef<ModeratorRefreshCodeComponent>
  ) {
  }

  ngOnInit(): void {
  }

  confirm() {
    this.dialogRef.close(true);
  }

  abort() {
    this.dialogRef.close(false);
  }

}
