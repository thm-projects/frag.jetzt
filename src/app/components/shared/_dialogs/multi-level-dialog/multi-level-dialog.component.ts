import { Component, Injector, Input, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  AnsweredMultiLevelData,
  MultiLevelData,
  MultiLevelDataBuiltAction,
  MultiLevelDataEntry,
} from './interface/multi-level-dialog.types';
import { MatStepper } from '@angular/material/stepper';
import {
  STEPPER_GLOBAL_OPTIONS,
  StepperSelectionEvent,
} from '@angular/cdk/stepper';
import {
  Observable,
  concat,
  forkJoin,
  isObservable,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { ExplanationDialogComponent } from '../explanation-dialog/explanation-dialog.component';

const WINDOW_SIZE = 3;

export type MultiLevelDialogSubmit<T> = (
  injector: Injector,
  answers: AnsweredMultiLevelData,
  data?: T,
) => Observable<any>;

class MultiLevelStepper {
  elements: MultiLevelDataBuiltAction<any>[] = [];
  progress = 0;
  highestIndex = -1;
  private answers: AnsweredMultiLevelData = {};
  private createdIndexes: number[] = [];
  private remaining = 0;
  private readonly removedCache = new Map<
    string,
    MultiLevelDataBuiltAction<any>
  >();
  private isRefreshing = false;

  constructor(
    private questions: MultiLevelDataEntry[],
    private injector: Injector,
    private dialogData: unknown,
    private defaultTouched: boolean,
    private updateView: () => void,
  ) {}

  getAnswers(): AnsweredMultiLevelData {
    return { ...this.answers };
  }

  reset() {
    this.progress = 0;
    this.highestIndex = -1;
    this.answers = {};
    this.createdIndexes.length = 0;
    this.elements.length = 0;
    this.remaining = 0;
    this.removedCache.clear();
    this.verify(-1);
  }

  next(index: number): boolean {
    const group = this.elements[index].group;
    group.markAllAsTouched();
    if (group.invalid) {
      return false;
    }
    this.highestIndex = index;
    this.progress = ((index + 1) * 100) / this.questions.length;
    return this.verify(index);
  }

  checkClick(index: number) {
    if (index > this.highestIndex && this.verify(index - 1)) {
      this.highestIndex = index - 1;
      this.progress = (index * 100) / this.questions.length;
    }
  }

  private verify(elementIndex: number): boolean {
    if (this.isRefreshing) {
      console.warn('Tried to do next before last update is finished!');
      return false;
    }
    const index = this.createdIndexes[elementIndex++] ?? -1;
    this.remaining = 0;
    const safeKeys = new Set<string>();
    for (let i = 0, j = 0; i < index; i++) {
      const isMounted = this.createdIndexes[j] === i;
      if (isMounted) {
        safeKeys.add(this.questions[i].tag);
        j += 1;
      }
    }
    const answers = { ...this.answers };
    const work: Observable<unknown>[] = [];
    let activeCount = 0;
    for (let i = index + 1; i < this.questions.length; i++) {
      const question = this.questions[i];
      const active = this.toObservable(answers, question.active);
      const count = this.toObservable(answers, question.count);
      const currentIndex = i;
      const isMounted = this.createdIndexes[elementIndex] === currentIndex;
      if (isMounted) {
        elementIndex += 1;
      }
      work.push(
        forkJoin([active, count]).pipe(
          switchMap(([isActive, isCounting]) => {
            this.remaining += isActive || isCounting ? 1 : 0;
            activeCount += isActive ? 1 : 0;
            if (isMounted && !isActive) {
              return this.removeElement(currentIndex, safeKeys, answers);
            } else if (!isMounted && isActive) {
              return this.addElement(currentIndex, safeKeys, answers);
            } else if (isActive) {
              return this.remount(currentIndex, answers);
            }
            return of(true);
          }),
        ),
      );
    }
    this.isRefreshing = true;
    concat(...work).subscribe({
      error: (err) => {
        console.error('An error occured during dialog build:', err);
        this.isRefreshing = false;
      },
      complete: () => {
        this.isRefreshing = false;
        if (activeCount < 1) {
          this.remaining = 0;
          this.highestIndex = this.questions.length - 1;
          this.progress = 100;
        }
        this.updateView();
      },
    });
    return true;
  }

  private remount(currentIndex: number, answers: AnsweredMultiLevelData) {
    const found = this.createdIndexes.findIndex((e) => e === currentIndex);
    if (found < 0) {
      console.error('This should not happen!');
      return;
    }
    const previousState = this.elements[found];
    const elemOrObservable = previousState.buildAction(
      this.injector,
      answers,
      previousState.group,
      this.dialogData,
    );
    const obs = isObservable(elemOrObservable)
      ? elemOrObservable
      : of(elemOrObservable);
    return obs.pipe(
      map((element) => {
        this.elements[found] = element;
        if (this.defaultTouched) {
          element.group.markAsTouched();
        }
        this.answers[previousState.tag] = {
          group: element.group,
        };
        return true;
      }),
    );
  }

  private removeElement(
    currentIndex: number,
    safeKeys: Set<string>,
    answers: AnsweredMultiLevelData,
  ): Observable<void> {
    const found = this.createdIndexes.findIndex((e) => e === currentIndex);
    if (found < 0) {
      console.error('This should not happen!');
      return;
    }
    this.createdIndexes.splice(found, 1);
    const previousState = this.elements.splice(found, 1)[0];
    const tag = previousState.tag;
    this.removedCache.set(tag, previousState);
    if (safeKeys.has(tag)) {
      console.warn('Tried to remove already present tag: ' + tag);
    } else {
      delete this.answers[tag];
      delete answers[tag];
    }
    return of();
  }

  private addElement(
    currentIndex: number,
    safeKeys: Set<string>,
    answers: AnsweredMultiLevelData,
  ): Observable<unknown> {
    const question = this.questions[currentIndex];
    // active, but not mounted
    if (!safeKeys.has(question.tag)) {
      safeKeys.add(question.tag);
      console.warn('Duplicate tag entry: ' + question.tag);
    }
    const previousState =
      this.removedCache.get(question.tag)?.group ??
      answers[question.tag]?.group;
    this.removedCache.delete(question.tag);
    const elemOrObservable = question.buildAction(
      this.injector,
      answers,
      previousState,
      this.dialogData,
    );
    // insert at position
    let index = this.createdIndexes.findIndex((e) => e > currentIndex);
    if (index < 0) {
      index = this.createdIndexes.length;
    }
    const dummy = {} as MultiLevelDataBuiltAction<any>;
    this.elements.splice(index, 0, dummy);
    this.createdIndexes.splice(index, 0, currentIndex);
    const obs = isObservable(elemOrObservable)
      ? elemOrObservable
      : of(elemOrObservable);
    return obs.pipe(
      map((element) => {
        this.elements[index] = element;
        if (this.defaultTouched) {
          element.group.markAsTouched();
        }
        this.answers[question.tag] = {
          group: element.group,
        };
        return true;
      }),
    );
  }

  private toObservable(
    answers: AnsweredMultiLevelData,
    func?: MultiLevelDataEntry['active'],
  ): Observable<boolean> {
    if (!func) {
      return of(true);
    }
    const result = func(answers, this.injector);
    return isObservable(result) ? result : of(Boolean(result));
  }
}

@Component({
  selector: 'app-multi-level-dialog',
  templateUrl: './multi-level-dialog.component.html',
  styleUrls: ['./multi-level-dialog.component.scss'],
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { displayDefaultIndicatorType: false },
    },
  ],
})
export class MultiLevelDialogComponent implements OnInit {
  @ViewChild('stepper') stepper: MatStepper;
  @Input() data: MultiLevelData;
  currentElements: MultiLevelDataBuiltAction<any>[] = [];
  readonly onClose = this.close.bind(this);
  remaining: number = 0;
  currentStepperIndex = 0;
  showBackOption = false;
  showForwardOption = false;
  offsetIndex = 0;
  loadingCount = 0;
  currentQuestion: MultiLevelDataBuiltAction<any>;
  readonly windowSize = WINDOW_SIZE;
  protected sending = false;
  protected dialogStepper: MultiLevelStepper;
  protected defaultTouched: boolean;
  private onSubmit: MultiLevelDialogSubmit<any>;
  private dialogData: any;

  constructor(
    private dialogRef: MatDialogRef<MultiLevelDialogComponent>,
    private dialog: MatDialog,
    private injector: Injector,
  ) {}

  public static open<T = any>(
    dialog: MatDialog,
    data: MultiLevelData<T>,
    onSubmit: MultiLevelDialogSubmit<T>,
    dialogData?: T,
    defaultTouched = false,
  ) {
    const dialogRef = dialog.open(MultiLevelDialogComponent, {
      width: '85vw',
      maxWidth: '600px',
      maxHeight: '99vh',
      panelClass: 'overflow-mat-dialog',
    });
    const instance = dialogRef.componentInstance;
    instance.data = data;
    instance.dialogData = dialogData;
    instance.onSubmit = onSubmit;
    instance.defaultTouched = defaultTouched;
    return dialogRef;
  }

  ngOnInit(): void {
    this.dialogStepper = new MultiLevelStepper(
      this.data.questions,
      this.injector,
      this.dialogData,
      this.defaultTouched,
      this.updateView.bind(this),
    );
    this.reset();
  }

  next(index: number) {
    if (this.dialogStepper.next(index)) {
      this.currentStepperIndex++;
    }
  }

  openHelp() {
    const help = this.currentQuestion.stepHelp;
    if (typeof help === 'string') {
      const ref = this.dialog.open(ExplanationDialogComponent);
      ref.componentInstance.translateKey = help;
    } else {
      this.dialog.open(help);
    }
  }

  onChange(e: StepperSelectionEvent) {
    this.currentStepperIndex = e.selectedIndex;
    if (this.showBackOption && e.selectedIndex === 0) {
      const last = this.offsetIndex;
      this.offsetIndex = Math.max(this.offsetIndex - WINDOW_SIZE, 0);
      this.currentStepperIndex =
        last - this.offsetIndex + Number(this.offsetIndex > 0) - 1;
      this.updateView();
      requestAnimationFrame(() => {
        for (
          let i = this.currentStepperIndex - this.stepper.selectedIndex;
          i > 0;
          i--
        ) {
          this.stepper.next();
        }
      });
    }
    if (
      this.showForwardOption &&
      e.selectedIndex === WINDOW_SIZE + Number(this.showBackOption)
    ) {
      const index =
        e.selectedIndex - Number(this.showBackOption) + this.offsetIndex;
      this.dialogStepper.checkClick(index);
      const last = this.offsetIndex;
      this.offsetIndex = Math.min(
        this.offsetIndex + WINDOW_SIZE,
        this.dialogStepper.elements.length - WINDOW_SIZE,
      );
      this.currentStepperIndex = WINDOW_SIZE + 1 + last - this.offsetIndex;
      this.updateView();
    }
    const index =
      this.currentStepperIndex + this.offsetIndex - Number(this.showBackOption);
    this.currentQuestion = this.dialogStepper.elements[index];
  }

  reset() {
    if (this.loadingCount > 0) {
      return;
    }
    this.stepper?.reset();
    this.currentStepperIndex = 0;
    this.offsetIndex = 0;
    this.dialogStepper.reset();
  }

  protected submit() {
    if (this.sending) {
      return;
    }
    this.sending = true;
    this.onSubmit(
      this.injector,
      this.dialogStepper.getAnswers(),
      this.dialogData,
    ).subscribe({
      next: (success) => {
        if (success) {
          this.dialogRef.close(this.dialogStepper.getAnswers());
        }
        this.sending = false;
      },
      error: () => {
        this.sending = false;
      },
    });
  }

  private close() {
    this.dialogRef.close();
  }

  private updateView() {
    this.showBackOption = this.offsetIndex > 0;
    this.showForwardOption =
      this.offsetIndex < this.dialogStepper.elements.length - WINDOW_SIZE;
    this.currentElements = this.dialogStepper.elements.slice(
      this.offsetIndex,
      this.offsetIndex + WINDOW_SIZE,
    );
    const index =
      this.currentStepperIndex + this.offsetIndex - Number(this.showBackOption);
    this.currentQuestion = this.dialogStepper.elements[index];
  }
}
