import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { ModeratorsComponent } from '../moderators/moderators.component';

@Component({
  selector: 'app-moderator-delete',
  templateUrl: './moderator-delete.component.html',
  styleUrls: ['./moderator-delete.component.scss']
})
export class ModeratorDeleteComponent implements OnInit {

  loginId: string;

  constructor(public dialogRef: MatDialogRef<ModeratorsComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
  }

  close(type: string): void {
    this.dialogRef.close(type);
  }

}
