import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-moderator-refresh-code',
  templateUrl: './moderator-refresh-code.component.html',
  styleUrls: ['./moderator-refresh-code.component.scss'],
})
export class ModeratorRefreshCodeComponent {
  constructor(private dialogRef: MatDialogRef<ModeratorRefreshCodeComponent>) {}
}
