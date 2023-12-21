import { Component, Injector, Input, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  AnsweredMultiLevelData,
  MultiLevelData,
  MultiLevelDataBuiltAction,
} from './interface/multi-level-dialog.types';
import { FormGroup } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import {
  STEPPER_GLOBAL_OPTIONS,
  StepperSelectionEvent,
} from '@angular/cdk/stepper';
import { Observable, forkJoin, isObservable, of } from 'rxjs';
import { ExplanationDialogComponent } from '../explanation-dialog/explanation-dialog.component';

const WINDOW_SIZE = 3;

export type MultiLevelDialogSubmit = (
  injector: Injector,
  answers: AnsweredMultiLevelData,
) => Observable<any>;

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
  elements: MultiLevelDataBuiltAction[] = [];
  currentElements: MultiLevelDataBuiltAction[] = [];
  readonly onClose = this.close.bind(this);
  remaining: number = 0;
  currentStepperIndex = 0;
  showBackOption = false;
  showForwardOption = false;
  offsetIndex = 0;
  highestIndex = -1;
  loadingCount = 0;
  currentQuestion: MultiLevelDataBuiltAction;
  readonly windowSize = WINDOW_SIZE;
  protected sending = false;
  private onSubmit: MultiLevelDialogSubmit;
  private createdIndexes: number[] = [];
  private answers: { [key: string]: FormGroup } = {};
  private readonly removedCache = new Map<string, MultiLevelDataBuiltAction>();

  constructor(
    private dialogRef: MatDialogRef<MultiLevelDialogComponent>,
    private dialog: MatDialog,
    private injector: Injector,
  ) {}

  public static open(
    dialog: MatDialog,
    data: MultiLevelData,
    onSubmit: MultiLevelDialogSubmit,
  ) {
    const dialogRef = dialog.open(MultiLevelDialogComponent, {
      width: '85vw',
      maxWidth: '600px',
      maxHeight: '99vh',
      panelClass: 'overflow-mat-dialog',
    });
    dialogRef.componentInstance.data = data;
    dialogRef.componentInstance.onSubmit = onSubmit;
    return dialogRef;
  }

  ngOnInit(): void {
    this.reset();
  }

  next(index: number) {
    if (this.loadingCount > 0) {
      return;
    }
    const group = this.elements[index].group;
    group.markAllAsTouched();
    if (group.invalid) {
      return;
    }
    this.highestIndex = index;
    this.currentStepperIndex++;
    this.verify(index);
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
      if (index > this.highestIndex) {
        this.verify(index - 1);
      }
      const last = this.offsetIndex;
      this.offsetIndex = Math.min(
        this.offsetIndex + WINDOW_SIZE,
        this.elements.length - WINDOW_SIZE,
      );
      this.currentStepperIndex = WINDOW_SIZE + 1 + last - this.offsetIndex;
      this.updateView();
    }
    const index =
      this.currentStepperIndex + this.offsetIndex - Number(this.showBackOption);
    this.currentQuestion = this.elements[index];
  }

  reset() {
    if (this.loadingCount > 0) {
      return;
    }
    this.stepper?.reset();
    this.answers = {};
    this.removedCache.clear();
    this.elements.length = 0;
    this.createdIndexes.length = 0;
    this.currentStepperIndex = 0;
    this.offsetIndex = 0;
    this.highestIndex = -1;
    this.verify(-1);
  }

  protected submit() {
    if (this.sending) {
      return;
    }
    this.sending = true;
    this.onSubmit(this.injector, this.answers).subscribe({
      next: (success) => {
        if (success) {
          this.dialogRef.close(this.answers);
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
      this.offsetIndex < this.elements.length - WINDOW_SIZE;
    this.currentElements = this.elements.slice(
      this.offsetIndex,
      this.offsetIndex + WINDOW_SIZE,
    );
    const index =
      this.currentStepperIndex + this.offsetIndex - Number(this.showBackOption);
    this.currentQuestion = this.elements[index];
  }

  private verify(elementIndex: number) {
    if (this.loadingCount > 0) {
      console.warn('Tried to verify while loading');
      return;
    }
    const first = this.createdIndexes[elementIndex++] ?? -1;
    this.remaining = 0;
    this.workOnElement(first + 1, elementIndex, { ...this.answers }, 0);
  }

  private workOnElement(
    currentIndex: number,
    elementIndex: number,
    previous: AnsweredMultiLevelData,
    activeCount: number,
  ) {
    const questions = this.data.questions;
    if (currentIndex >= questions.length) {
      if (activeCount === 0) {
        this.remaining = 0;
        this.highestIndex = questions.length - 1;
      }
      this.updateView();
      return;
    }
    this.loadingCount += 1;
    const toObservable = (
      func?: (
        answers: AnsweredMultiLevelData,
        injector: Injector,
      ) => boolean | Observable<boolean>,
    ) => {
      if (!func) {
        return of(true);
      }
      const result = func(previous, this.injector);
      return isObservable(result) ? result : of(Boolean(result));
    };
    const question = questions[currentIndex];
    const active = toObservable(question.active);
    const count = toObservable(question.count);
    forkJoin([active, count]).subscribe(([isActive, isCounting]) => {
      const isMounted = this.createdIndexes[elementIndex] === currentIndex;
      this.remaining += isActive || isCounting ? 1 : 0;
      activeCount += isActive ? 1 : 0;
      if (isMounted) {
        // mounted, but inactive
        if (!isActive) {
          this.createdIndexes.splice(elementIndex, 1);
          this.removedCache.set(
            question.tag,
            this.elements.splice(elementIndex, 1)[0],
          );
          delete this.answers[question.tag];
          delete previous[question.tag];
        } else {
          elementIndex++;
        }
      } else if (isActive) {
        // active, but not mounted
        const previousState = this.removedCache.get(question.tag);
        this.removedCache.delete(question.tag);
        const elemOrObservable = question.buildAction(
          this.injector,
          previous,
          previousState,
        );
        // insert at position
        const index = elementIndex;
        const dummy = !isObservable(elemOrObservable)
          ? elemOrObservable
          : ({} as MultiLevelDataBuiltAction);
        this.elements.splice(elementIndex, 0, dummy);
        this.createdIndexes.splice(elementIndex, 0, currentIndex);
        elementIndex++;
        if (isObservable(elemOrObservable)) {
          this.loadingCount += 1;
          elemOrObservable.subscribe((element) => {
            this.loadingCount -= 1;
            this.elements[index] = element;
            this.answers[question.tag] = element.group;
          });
        } else {
          this.answers[question.tag] = dummy.group;
        }
      }
      this.loadingCount -= 1;
      this.workOnElement(currentIndex + 1, elementIndex, previous, activeCount);
    });
  }
}
