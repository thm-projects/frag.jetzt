import { Component, HostBinding, Input, OnInit } from '@angular/core';
import { LivepollSession } from '../../../../../models/livepoll-session';

@Component({
  selector: 'app-livepoll-live-indicator',
  templateUrl: './livepoll-live-indicator.component.html',
  styleUrls: ['./livepoll-live-indicator.component.scss'],
})
export class LivepollLiveIndicatorComponent implements OnInit {
  @Input() livepollSession: LivepollSession;
  public readonly translateKey: string = 'common';

  constructor() {}

  @HostBinding('class.live-indicator-paused') get isPaused(): boolean {
    return this.livepollSession.paused;
  }

  @HostBinding('class.live-indicator-active') get notPaused(): boolean {
    return !this.livepollSession.paused;
  }

  ngOnInit(): void {}
}
