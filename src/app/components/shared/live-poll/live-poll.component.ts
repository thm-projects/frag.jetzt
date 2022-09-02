import {ChangeDetectorRef, Component, EventEmitter, Output} from '@angular/core';
import {ArsLifeCycleVisitor} from '../../../../../projects/ars/src/lib/models/util/ars-life-cycle-visitor';
import {DeviceInfoService} from '../../../services/util/device-info.service';
import {TranslateService} from '@ngx-translate/core';
import {
  LivePollData,
  LivePollMockService,
  LivePollSession,
  predefinedSymbolSets
} from '../../../services/mocks/live-poll-mock.service';
import {RoomService} from '../../../services/http/room.service';
import {Room} from '../../../models/room';
import {LivePollBuildInfo, LivePollList} from './live-poll-entry/LivePollEntry';
import {User} from '../../../models/user';

export interface LivePollConfiguration{
  session: LivePollSession;
  user: User;
  room: Room;
  change: EventEmitter<void>;
}

@Component({
  selector: 'app-live-poll',
  templateUrl: './live-poll.component.html',
  styleUrls: ['./live-poll.component.scss']
})
export class LivePollComponent extends ArsLifeCycleVisitor {

  @Output() public closeEmitter: EventEmitter<number> = new EventEmitter<number>();
  public data: LivePollConfiguration;
  public user: User;
  public room: Room;
  public isLoaded: boolean = false;
  public session: LivePollSession;
  public isCreator: boolean = true;
  public isCreate: boolean = false;
  public livePollFocus: LivePollData = null;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    public device: DeviceInfoService,
    public translate: TranslateService,
    public livePollSessionService: LivePollMockService,
    public roomService: RoomService
  ) {
    super();
  }

  public setSessionData(options: { room: Room; user: User }) {
    this.user=options.user;
    this.room=options.room;
    this.livePollSessionService.getSessionData(options.room).subscribe(e => {
      this.session = e;
      this.data={...options,...{session:this.session,change:new EventEmitter<void>()}};
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
        e.transition = 'all 0.5s cubic-bezier(.87,0,.27,.99)';
        e.backgroundColor = 'var(--background)';
        setTimeout(() => {
          e.width = '200vw';
          e.height = '200vw';
          e.left = '-50vw';
          e.top = '-50vw';
          e.backgroundColor = 'var(--surface)';
          setTimeout(() => {
            this.changeDetectorRef.detectChanges();
            this.isLoaded = true;
          }, 500);
        }, 1);
      }
    });
  }

  public createNewLivePoll(list: LivePollBuildInfo){
    this.session.previousLivePoll=this.session.currentLivePoll;
    this.session.currentLivePoll=new LivePollList();
    this.session.currentLivePoll.symbolSet=list.symbolSet;
    this.session.currentLivePoll.name=list.name;
    this.livePollSessionService.updateSessionData(this.session);
  }

  startLivePoll() {
    this.livePollFocus=this.session.currentLivePoll;
    this.livePollSessionService.start().subscribe(e=>{
      if(e.hasActiveLivePoll){
        this.livePollFocus=e.currentLivePoll;
      }
      this.session={...this.session,...e};
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

  public debug_force() {
    this.createNewLivePoll({
      name: 'Do you like Live-Polls?',
      symbolSet: predefinedSymbolSets[0][1]
    });
    this.startLivePoll();
  }
}
