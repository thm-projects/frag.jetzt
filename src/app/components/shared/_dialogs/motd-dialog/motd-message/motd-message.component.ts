import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { Motd } from '../../../../../models/motd';
import {
  ArsApproximateDate,
  ArsDateFormatter,
} from '../../../../../../../projects/ars/src/lib/services/ars-date-formatter.service';
import { ArsUtil } from '../../../../../../../projects/ars/src/lib/models/util/ars-util';
import { AppStateService } from 'app/services/state/app-state.service';

@Component({
  selector: 'app-motd-message',
  templateUrl: './motd-message.component.html',
  styleUrls: ['./motd-message.component.scss'],
})
export class MotdMessageComponent implements OnInit, OnDestroy {
  @Input() message: Motd;
  @Output() clickRead = new EventEmitter<Motd>();
  translatedMessage: string;
  date: EventEmitter<ArsApproximateDate> =
    new EventEmitter<ArsApproximateDate>();
  release: (() => void)[] = [];

  constructor(
    private appState: AppStateService,
    private arsDateFormatter: ArsDateFormatter,
  ) {}

  ngOnInit(): void {
    this.date.subscribe((e) => {
      this.message.date = this.arsDateFormatter.format(
        e,
        this.appState.getCurrentLanguage(),
      );
    });
    this.release.push(
      ArsUtil.setInterval(
        () => {
          this.date.emit(
            this.arsDateFormatter.approximateDate(this.message.startTimestamp),
          );
        },
        1000,
        true,
      ),
    );
    this.translatedMessage = this.message.getMessage(
      this.appState.getCurrentLanguage(),
    );
  }

  public setIsRead(isRead: boolean) {
    this.message.isRead = isRead;
    this.clickRead.emit(this.message);
  }

  ngOnDestroy() {
    this.release.forEach((e) => e());
  }
}
