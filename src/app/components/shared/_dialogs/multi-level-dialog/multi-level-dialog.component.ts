import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MultiLevelDialogDirector } from './interface/multi-level-dialog.director';
import { MultiLevelData } from './interface/multi-level-dialog.types';
import { MultiLevelSelectActionComponent } from './multi-level-select-action/multi-level-select-action.component';
import { ReplaySubject, takeUntil } from 'rxjs';

const MAPPER = {
  select: MultiLevelSelectActionComponent,
};

@Component({
  selector: 'app-multi-level-dialog',
  templateUrl: './multi-level-dialog.component.html',
  styleUrls: ['./multi-level-dialog.component.scss'],
})
export class MultiLevelDialogComponent implements OnInit, OnDestroy {
  @Input() data: MultiLevelData;
  @ViewChildren('contentElement') elements: QueryList<
    ElementRef<HTMLDivElement>
  >;
  @ViewChildren('contentButton', { read: ElementRef<HTMLButtonElement> })
  elementButtons: QueryList<ElementRef<HTMLButtonElement>>;
  readonly onClose = this.close.bind(this);
  readonly onSubmit = this.submit.bind(this);
  activeIndex = 0;
  open = false;
  director: MultiLevelDialogDirector;
  private scheduledFrame: any = 0;
  private activeSetFrame: any = 0;
  private destroyed = new ReplaySubject<boolean>();

  constructor(private dialogRef: MatDialogRef<MultiLevelDialogComponent>) {}

  public static open(dialog: MatDialog, data: MultiLevelData) {
    const dialogRef = dialog.open(MultiLevelDialogComponent, {
      maxWidth: '99vw',
      maxHeight: '99vh',
    });
    dialogRef.componentInstance.data = data;
    return dialogRef;
  }

  getComponentFromType(action: string) {
    return MAPPER[action];
  }

  ngOnInit(): void {
    this.director = new MultiLevelDialogDirector(this.data);
    this.director.newElement
      .pipe(takeUntil(this.destroyed))
      .subscribe((i) => this.setActiveIndex(i));
    this.director.finished
      .pipe(takeUntil(this.destroyed))
      .subscribe(() => this.submit());
  }

  ngOnDestroy(): void {
    this.destroyed.next(true);
    this.destroyed.complete();
  }

  onScroll(event: any) {
    const elem = event.target as HTMLElement;
    cancelAnimationFrame(this.activeSetFrame);
    this.activeSetFrame = requestAnimationFrame(() => {
      const rect = elem.getBoundingClientRect();
      const bSearch = this.bSearch(elem.children, (rect.bottom + rect.top) / 2);
      this.activeIndex = Number((bSearch as HTMLElement).dataset.id);
    });
  }

  setActiveIndex(index: number) {
    cancelAnimationFrame(this.scheduledFrame);
    this.scheduledFrame = requestAnimationFrame(() => {
      const button = this.elementButtons.get(index)?.nativeElement;
      if (button) {
        button.scrollIntoView({
          behavior: 'auto',
          block: 'start',
          inline: 'nearest',
        });
      }
      const elem = this.elements.get(index)?.nativeElement;
      if (!elem) {
        return;
      }
      elem.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      });
    });
  }

  private close() {
    this.dialogRef.close();
  }

  private submit() {
    this.dialogRef.close(this.director.getAnswers());
  }

  private bSearch(elements: HTMLCollection, target: number) {
    let start = 0;
    let end = elements.length - 1;
    while (start <= end) {
      const mid = Math.floor((start + end) / 2);
      const value = elements[mid].getBoundingClientRect();
      const v1 = value.top - target;
      const v2 = value.bottom - target;
      if (v1 >= 0) {
        end = mid - 1;
      } else if (v2 >= 0) {
        return elements[mid];
      } else {
        start = mid + 1;
      }
    }
    return elements[elements.length - 1];
  }
}
