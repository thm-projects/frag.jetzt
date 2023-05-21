import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  HostBinding,
  Inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ComposedData } from '../../../../../../services/util/overlay.service';
import { LivepollService } from '../../../../../../services/http/livepoll.service';
import { SessionService } from '../../../../../../services/util/session.service';
import { LivepollSession } from '../../../../../../models/livepoll-session';
import { prettyPrintDate } from 'app/utils/date';
import { LanguageService } from '../../../../../../services/util/language.service';
import { MatSelectionListChange } from '@angular/material/list';
import { FormBuilder, FormControl } from '@angular/forms';

@Component({
  selector: 'app-livepoll-archive',
  templateUrl: './livepoll-archive.component.html',
  styleUrls: ['./livepoll-archive.component.scss'],
})
export class LivepollArchiveComponent
  implements OnInit, AfterViewInit, OnDestroy {
  @HostBinding('class') cls: string = 'livepoll-archive';
  public entries: LivepollSession[];
  selected: LivepollSession | undefined;
  base: LivepollSession;
  comparison: LivepollSession;
  leftLivepollSelection: FormControl = new FormControl<LivepollSession>(null);
  rightLivepollSelection: FormControl = new FormControl<LivepollSession>(null);
  public readonly translateKey: string = 'common';
  public mode: 'beforeCompare' | 'compare' = 'beforeCompare';
  public data: {
    initial: LivepollSession;
  };

  /**/

  showSelectionList: boolean = false;
  current: LivepollSession | undefined;
  showOutline: boolean = false;
  /**/

  constructor(
    public readonly livepollService: LivepollService,
    public readonly session: SessionService,
    public readonly language: LanguageService,
    private _formBuilder: FormBuilder,
    public readonly cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) data: ComposedData,
  ) {
    this.data = data.data;
    this.livepollService
      .findByRoomId(this.session.currentRoom.id)
      .subscribe((entries) => {
        this.entries = entries;
        this.base = this.entries.filter(
          (x) => x.id === this.data.initial.id,
        )[0];
        this.cdr.detectChanges();
      });
  }

  get left(): LivepollSession | null {
    return this.leftLivepollSelection.value;
  }

  get right(): LivepollSession | null {
    return this.rightLivepollSelection.value;
  }

  get canCompare(): boolean {
    return !!this.left && !!this.right && this.left.id !== this.right.id;
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {}

  prettyPrintDate(date: Date) {
    return prettyPrintDate(date, this.language.currentLanguage());
  }

  setSelection($event: MatSelectionListChange) {
    this.selected = this.entries[$event.source._value[0]];
  }

  compare() {
    this.mode = 'compare';
  }
}
