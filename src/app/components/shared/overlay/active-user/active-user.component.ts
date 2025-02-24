import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Room } from '../../../../models/room';
import { HeaderService } from '../../../../services/util/header.service';
import { map, ReplaySubject, takeUntil } from 'rxjs';
import { DeviceStateService } from 'app/services/state/device-state.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { roomCount } from 'app/room/state/comment-updates';

@Component({
  selector: 'app-active-user',
  templateUrl: './active-user.component.html',
  styleUrls: ['./active-user.component.scss'],
  standalone: false,
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
  private userCount$ = toObservable(roomCount).pipe(
    map((x) =>
      x ? String(x.participantCount + x.moderatorCount + x.creatorCount) : '?',
    ),
  );

  constructor(
    private headerService: HeaderService,
    private deviceState: DeviceStateService,
  ) {}

  ngOnInit(): void {
    this.deviceState.mobile$
      .pipe(takeUntil(this.destroyer))
      .subscribe((mobile) => {
        this.showByComponent = !(mobile || this.alwaysShowInHeader);
        this.headerService.toggleCurrentUserActivity(!this.showByComponent);
      });
    this.userCount$.pipe(takeUntil(this.destroyer)).subscribe((value) => {
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
