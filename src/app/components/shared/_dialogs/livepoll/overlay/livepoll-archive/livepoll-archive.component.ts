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
import { BehaviorSubject } from 'rxjs';
import { LivepollOptionEntry } from '../../livepoll-dialog/livepoll-dialog.component';
import { LivepollComponentUtility } from '../../livepoll-component-utility';
import {
  LivepollTemplateContext,
  templateEntries,
} from '../../../../../../models/livepoll-template';

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
  showOutline: boolean = true;
  private readonly _current: BehaviorSubject<LivepollSession | null> =
    new BehaviorSubject(null);
  private readonly _results: BehaviorSubject<number[] | null> =
    new BehaviorSubject(null);
  private readonly _totalVotes: BehaviorSubject<number> = new BehaviorSubject(
    0,
  );
  private readonly _options: BehaviorSubject<LivepollOptionEntry[] | null> =
    new BehaviorSubject(null);
  private readonly _template: BehaviorSubject<LivepollTemplateContext | null> =
    new BehaviorSubject(null);

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
    this._current.subscribe((x) => {
      if (x) {
        this._template.next(templateEntries[x.template]);
        this._options.next(
          LivepollComponentUtility.resolveTemplate(templateEntries[x.template]),
        );
        this.livepollService.getResults(x.id).subscribe((x) => {
          const o = x.map((a) => Math.ceil(Math.random() * 1000));
          this._results.next(o);
          this._totalVotes.next(o.reduce((a, b) => a + b, 0));
        });
      }
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

  get template(): LivepollTemplateContext | null {
    return this._template.value;
  }

  get options(): LivepollOptionEntry[] {
    return this._options.value;
  }

  get totalVotes(): number {
    return this._totalVotes.value;
  }

  get result(): number[] | null {
    return this._results.value;
  }

  get current(): LivepollSession | null {
    return this._current.value;
  }

  set current(current: LivepollSession) {
    this._current.next(current);
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
