import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Room } from '../../../../models/room';
import { HeaderService } from '../../../../services/util/header.service';
import { RoomDataService } from '../../../../services/util/room-data.service';
import { DeviceInfoService } from '../../../../services/util/device-info.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-active-user',
  templateUrl: './active-user.component.html',
  styleUrls: ['./active-user.component.scss']
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
  private _sub: Subscription;

  constructor(
    private headerService: HeaderService,
    private roomDataService: RoomDataService,
    private deviceInfo: DeviceInfoService,
  ) {
  }

  ngOnInit(): void {
    this.deviceInfo.isMobile().subscribe(mobile => {
      this.showByComponent = !(mobile || this.alwaysShowInHeader);
      this.headerService.toggleCurrentUserActivity(!this.showByComponent);
    });
    this._sub = this.roomDataService.observeUserCount().subscribe(value => {
      this.activeUser = value;
      this.headerService.setCurrentUserActivity(value);
    });
  }

  ngOnDestroy() {
    this.headerService.toggleCurrentUserActivity(false);
    this._sub?.unsubscribe();
  }

}
