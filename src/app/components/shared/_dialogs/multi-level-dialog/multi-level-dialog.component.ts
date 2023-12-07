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
import { Observable } from 'rxjs';

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
    this.verify(-1);
    this.updateView();
  }

  next(index: number) {
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
    this.dialog.open(this.data.helpComponent);
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
        this.verify(index);
      }
      const last = this.offsetIndex;
      this.offsetIndex = Math.min(
        this.offsetIndex + WINDOW_SIZE,
        this.elements.length - WINDOW_SIZE,
      );
      this.currentStepperIndex = WINDOW_SIZE + 1 + last - this.offsetIndex;
      this.updateView();
    }
  }

  reset() {
    this.stepper.reset();
    this.answers = {};
    this.removedCache.clear();
    this.elements.length = 0;
    this.createdIndexes.length = 0;
    this.currentStepperIndex = 0;
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
  }

  private verify(elementIndex: number) {
    const first = this.createdIndexes[elementIndex++] ?? -1;
    const questions = this.data.questions;
    this.remaining = 0;
    let active = 0;
    for (let i = first + 1; i < questions.length; i++) {
      const question = questions[i];
      const isActive = !question.active || question.active(this.answers);
      const isCounting = !question.count || question.count(this.answers);
      const isMounted = this.createdIndexes[elementIndex] === i;
      this.remaining += isActive || isCounting ? 1 : 0;
      active += isActive ? 1 : 0;
      if (isMounted) {
        // mounted, but inactive
        if (!isActive) {
          this.createdIndexes.splice(elementIndex, 1);
          this.removedCache.set(
            question.tag,
            this.elements.splice(elementIndex, 1)[0],
          );
          delete this.answers[question.tag];
        } else {
          elementIndex++;
        }
        continue;
      }
      if (isActive) {
        // active, but not mounted
        const previousState = this.removedCache.get(question.tag);
        this.removedCache.delete(question.tag);
        const element = question.buildAction(
          this.injector,
          this.answers,
          previousState,
        );
        // insert at position
        this.elements.splice(elementIndex, 0, element);
        this.createdIndexes.splice(elementIndex, 0, i);
        elementIndex++;
        this.answers[question.tag] = element.group;
      }
    }
    if (active === 0) {
      this.remaining = 0;
      this.highestIndex = this.elements.length - 1;
    }
    this.updateView();
  }
}
