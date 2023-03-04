import { Component, OnInit } from '@angular/core';
import { UserRole } from '../../../../models/user-roles.enum';

@Component({
  selector: 'app-livepoll-dialog',
  templateUrl: './livepoll-dialog.component.html',
  styleUrls: ['./livepoll-dialog.component.scss'],
})
export class LivepollDialogComponent implements OnInit {
  userRole: UserRole;

  constructor() {}

  ngOnInit(): void {}
}
