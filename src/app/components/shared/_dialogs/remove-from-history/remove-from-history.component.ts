import { Component, Input } from '@angular/core';
import { UserRole } from '../../../../models/user-roles.enum';

@Component({
  selector: 'app-remove-from-history',
  templateUrl: './remove-from-history.component.html',
  styleUrls: ['./remove-from-history.component.scss'],
})
export class RemoveFromHistoryComponent {
  @Input() roomName: string;
  @Input() role: UserRole;

  constructor() {}
}
