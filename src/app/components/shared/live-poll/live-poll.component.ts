import {ChangeDetectorRef, Component, EventEmitter, Output} from '@angular/core';
import {ArsLifeCycleVisitor} from '../../../../../projects/ars/src/lib/models/util/ars-life-cycle-visitor';
import {LivePollEntry, LivePollList} from './live-poll-entry/LivePollEntry';
import {DeviceInfoService} from '../../../services/util/device-info.service';

@Component({
  selector: 'app-live-poll',
  templateUrl: './live-poll.component.html',
  styleUrls: ['./live-poll.component.scss']
})
export class LivePollComponent extends ArsLifeCycleVisitor {

  @Output() public closeEmitter: EventEmitter<number> = new EventEmitter<number>();
  public isLoaded: boolean = false;
  public list: LivePollList;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    public device: DeviceInfoService
  ) {
    super();
    this.onInit(() => {
      this.list = new LivePollList();
      'ABCD'.split('').forEach(e => {
        const entry: LivePollEntry = new LivePollEntry();
        entry.symbol = e;
        this.list.list.push(entry);
      });
      const interval = setInterval(() => {
        this.list.list[Math.floor(Math.random() * 4)].value += 1;
        this.list.sum++;
        this.list.propagate();
      }, 800);
      this.onDestroy(() => clearInterval(interval));
    });
  }

  public setIntroConfig(options?: { e: MouseEvent }) {
    this.onAfterViewInit(() => {
      if (typeof options === undefined) {
        this.isLoaded = true;
      } else {
        const e: CSSStyleDeclaration = document.getElementById('livePollExpander').style;
        e.left = (options.e.clientX - 32) + 'px';
        e.top = (options.e.clientY - 32) + 'px';
        e.transition = 'all 0.7s cubic-bezier(.87,0,.27,.99)';
        setTimeout(() => {
          e.width = '100vw';
          e.height = '100vh';
          e.left = '0px';
          e.top = '0px';
          e.borderRadius = '0px';
          setTimeout(() => {
            this.changeDetectorRef.detectChanges();
            this.isLoaded = true;
          }, 700);
        }, 1);
      }
    });
  }

  public close() {
    this.closeEmitter.emit(0);
  }

}
