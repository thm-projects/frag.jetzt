import {Component, OnInit} from '@angular/core';
import {User} from '../../../../models/user';
import {UserRole} from '../../../../models/user-roles.enum';
import {LivepollServiceMock} from '../../../../services/mocks/livepoll.service.mock';
import {WsLivepollServiceMock} from '../../../../services/mocks/ws-livepoll.service.mock';

@Component({
  selector: 'app-livepoll-dialog',
  templateUrl: './livepoll-dialog.component.html',
  styleUrls: ['./livepoll-dialog.component.scss']
})
export class LivepollDialogComponent implements OnInit {
  isCreator: boolean | undefined;
  data: {
    user: User;
    options: {
      icons: string[];
      names: string[];
    };
  };

  constructor(
    public livepollService: LivepollServiceMock,
    public wsLivepollService: WsLivepollServiceMock
  ) {
  }

  ngOnInit(): void {
    if (this.data) {
      this.isCreator = this.data.user.role === UserRole.CREATOR;
    } else {
      throw new Error();
    }
  }

  vote(i: number) {
    this.wsLivepollService.send(i, this.data.user);
  }
}
