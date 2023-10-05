import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Motd } from '../../../../../models/motd';
import {
  ArsApproximateDate,
  ArsDateFormatter,
} from '../../../../../../../projects/ars/src/lib/services/ars-date-formatter.service';
import { ArsUtil } from '../../../../../../../projects/ars/src/lib/models/util/ars-util';
import { AccountStateService } from 'app/services/state/account-state.service';
import { AppStateService } from 'app/services/state/app-state.service';

@Component({
  selector: 'app-motd-message',
  templateUrl: './motd-message.component.html',
  styleUrls: ['./motd-message.component.scss'],
})
export class MotdMessageComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() message: Motd;
  @ViewChild('markdown', { static: true }) markdown: any;
  translatedMessage: string;
  date: EventEmitter<ArsApproximateDate> =
    new EventEmitter<ArsApproximateDate>();
  release: (() => void)[] = [];

  constructor(
    private appState: AppStateService,
    private arsDateFormatter: ArsDateFormatter,
    private accountState: AccountStateService,
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
    if (isRead) {
      this.accountState.readMotds([this.message.id]);
    } else {
      this.accountState.unreadMotd(this.message.id);
    }
    this.message.isRead = isRead;
  }

  ngAfterViewInit(): void {
    Array.from<HTMLElement>(
      this.markdown.element.nativeElement.children,
    ).forEach((e) => (e.tabIndex = 0));
  }

  ngOnDestroy() {
    this.release.forEach((e) => e());
  }
}
