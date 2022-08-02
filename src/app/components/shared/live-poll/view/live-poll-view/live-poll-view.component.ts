import {ChangeDetectorRef, Component, Input, OnInit} from '@angular/core';
import {DeviceInfoService} from '../../../../../services/util/device-info.service';
import {TranslateService} from '@ngx-translate/core';
import {LivePollMockService} from '../../../../../services/mocks/live-poll-mock.service';
import {RoomService} from '../../../../../services/http/room.service';
import {LivePollConfiguration} from '../../live-poll.component';

@Component({
  selector: 'app-live-poll-view',
  templateUrl: './live-poll-view.component.html',
  styleUrls: ['../../live-poll.component.scss']
})
export class LivePollViewComponent implements OnInit {

  @Input() data: LivePollConfiguration;
  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    public device: DeviceInfoService,
    public translate: TranslateService,
    public livePollSessionService: LivePollMockService,
    public roomService: RoomService) { }

  ngOnInit(): void {
  }

}
