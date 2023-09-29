import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Room } from '../../../../models/room';
import { HeaderService } from '../../../../services/util/header.service';
import { RoomDataService } from '../../../../services/util/room-data.service';
import { ReplaySubject, Subscription, takeUntil } from 'rxjs';
import { DeviceStateService } from 'app/services/state/device-state.service';

@Component({
  selector: 'app-active-user',
  templateUrl: './active-user.component.html',
  styleUrls: ['./active-user.component.scss'],
})
export class ActiveUserComponent implements OnInit, OnDestroy {
  @Input() room: Room;
  @Input() iconColor: string;
  @Input() foregroundColor: string;
  @Input() backgroundColor: string;
  @Input() left: number;
  @Input() top: number;
  @Input() alwaysShowInHeader: boolean;
  @ViewChild('divElement') elem: HTMLElement;
  activeUser = '?';
  showByComponent: boolean;
  private destroyer = new ReplaySubject(1);

  constructor(
    private headerService: HeaderService,
    private roomDataService: RoomDataService,
    private deviceState: DeviceStateService,
  ) {}

  ngOnInit(): void {
    this.deviceState.mobile$
      .pipe(takeUntil(this.destroyer))
      .subscribe((mobile) => {
        this.showByComponent = !(mobile || this.alwaysShowInHeader);
        this.headerService.toggleCurrentUserActivity(!this.showByComponent);
      });
    this.roomDataService
      .observeUserCount()
      .pipe(takeUntil(this.destroyer))
      .subscribe((value) => {
        this.activeUser = value;
        this.headerService.setCurrentUserActivity(value);
      });
  }

  ngOnDestroy() {
    this.destroyer.next(true);
    this.destroyer.complete();
    this.headerService.toggleCurrentUserActivity(false);
  }
}
