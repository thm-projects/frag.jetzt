import {ChangeDetectorRef, Component, EventEmitter, Output} from '@angular/core';
import {ArsLifeCycleVisitor} from '../../../../../projects/ars/src/lib/models/util/ars-life-cycle-visitor';
import {DeviceInfoService} from '../../../services/util/device-info.service';
import {TranslateService} from '@ngx-translate/core';
import {LivePollMockService, LivePollSession} from '../../../services/mocks/live-poll-mock.service';
import {RoomService} from '../../../services/http/room.service';
import {Room} from '../../../models/room';

@Component({
  selector: 'app-live-poll',
  templateUrl: './live-poll.component.html',
  styleUrls: ['./live-poll.component.scss']
})
export class LivePollComponent extends ArsLifeCycleVisitor {

  @Output() public closeEmitter: EventEmitter<number> = new EventEmitter<number>();
  public isLoaded: boolean = false;
  public session: LivePollSession;
  public isCreator: boolean = true;
  public isCreate: boolean = true;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    public device: DeviceInfoService,
    public translate: TranslateService,
    public livePollSessionService: LivePollMockService,
    public roomService: RoomService
  ) {
    super();
  }

  public setSessionData(options: { room: Room }) {
    this.livePollSessionService.getSessionData(options.room).subscribe(e => {
      this.session = e;
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
        e.backgroundColor = 'var(--surface)';
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
    if (this.isCreate) {
      this.isCreate = false;
    } else {
      this.closeEmitter.emit(0);
    }
  }

  public createLivePoll() {
    this.isCreate = true;
  }
}
