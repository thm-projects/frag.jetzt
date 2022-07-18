import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {DeviceInfoService} from '../../../../../services/util/device-info.service';
import {TranslateService} from '@ngx-translate/core';
import {LivePollMockService, LivePollSession} from '../../../../../services/mocks/live-poll-mock.service';

@Component({
  selector: 'app-live-poll-participant-view',
  templateUrl: './live-poll-participant-view.component.html',
  styleUrls: ['./live-poll-participant-view.component.scss']
})
export class LivePollParticipantViewComponent implements OnInit {

  session: LivePollSession;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    public device: DeviceInfoService,
    public translate: TranslateService,
    public livePollSessionService: LivePollMockService
  ) {
  }

  ngOnInit(): void {
  }

}
