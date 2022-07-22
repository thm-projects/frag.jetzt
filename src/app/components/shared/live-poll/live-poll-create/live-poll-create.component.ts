import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {DeviceInfoService} from '../../../../services/util/device-info.service';
import {
  LivePollMockService,
  LivePollSession,
  LivePollSymbolSet
} from '../../../../services/mocks/live-poll-mock.service';
import {LivePollBuildInfo, LivePollList} from '../live-poll-entry/LivePollEntry';

@Component({
  selector: 'app-live-poll-create',
  templateUrl: './live-poll-create.component.html',
  styleUrls: ['../live-poll.component.scss']
})
export class LivePollCreateComponent implements OnInit {

  @Input() session: LivePollSession;
  @Output() submitEmit: EventEmitter<LivePollBuildInfo>=new EventEmitter<LivePollBuildInfo>();

  public data: LivePollList;
  public isValid: boolean = false;

  constructor(
    public device: DeviceInfoService,
    public livePollService: LivePollMockService
  ) {
    this.data = new LivePollList();
    this.data.list.forEach(e => {
      e.value = Math.floor(Math.random() * 10);
    });
    this.data.propagate();
  }

  ngOnInit(): void {
  }

  public setSymbolSet(set: [string, LivePollSymbolSet]) {
    this.data.symbolSet = set[1];
    this.revalidate();
  }

  public submit() {
    this.submitEmit.emit(this.data);
  }

  private revalidate() {
    for (let i = 0; i < 4; i++) {
      this.data.list[i].symbol = this.data.symbolSet.symbol[i];
      this.data.list[i].type = this.data.symbolSet.type;
    }
    this.isValid = !!(this.data.name && this.data.symbolSet);
  }
}
