import {Component, Input, OnInit} from '@angular/core';
import {DeviceInfoService} from '../../../../services/util/device-info.service';
import {
  LivePollData,
  LivePollMockService,
  LivePollSession,
  LivePollSymbolSet
} from '../../../../services/mocks/live-poll-mock.service';

@Component({
  selector: 'app-live-poll-create',
  templateUrl: './live-poll-create.component.html',
  styleUrls: ['./live-poll-create.component.scss']
})
export class LivePollCreateComponent implements OnInit {

  @Input() session: LivePollSession;

  public data: LivePollData;

  constructor(
    public device: DeviceInfoService,
    public livePollService: LivePollMockService
  ) {
    this.data={
      list:[],
      highest:0,
      sum:0,
      name:'My Live-Poll',
      symbolSet: livePollService.defaultSymbolSet()[0][1]
    };
  }

  ngOnInit(): void {
  }

  public setSymbolSet(set: [string, LivePollSymbolSet]) {
    this.data.symbolSet=set[1];
  }
}
