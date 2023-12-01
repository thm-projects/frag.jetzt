import { Component, Injector, Input, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  MultiLevelData,
  MultiLevelDataBuiltAction,
} from './interface/multi-level-dialog.types';
import { FormGroup } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
@Component({
  selector: 'app-multi-level-dialog',
  templateUrl: './multi-level-dialog.component.html',
  styleUrls: ['./multi-level-dialog.component.scss'],
})
export class MultiLevelDialogComponent implements OnInit {
  @Input() data: MultiLevelData;
  elements: MultiLevelDataBuiltAction[] = [];
  readonly onClose = this.close.bind(this);
  remaining: [number, number] = [0, 0];
  private createdIndexes: number[] = [];
  private answers: { [key: string]: FormGroup } = {};
  private readonly removedCache = new Map<string, MultiLevelDataBuiltAction>();

  constructor(
    private dialogRef: MatDialogRef<MultiLevelDialogComponent>,
    private injector: Injector,
  ) {}

  public static open(dialog: MatDialog, data: MultiLevelData) {
    const dialogRef = dialog.open(MultiLevelDialogComponent, {
      width: '85vw',
      maxWidth: '600px',
      maxHeight: '99vh',
    });
    dialogRef.componentInstance.data = data;
    return dialogRef;
  }

  ngOnInit(): void {
    this.verify(-1);
  }

  checkIt(index: number, stepper: MatStepper) {
    const group = this.elements[index].group;
    group.markAllAsTouched();
    if (group.invalid) {
      return;
    }
    this.verify(index);
    requestAnimationFrame(() => {
      stepper.next();
    });
  }

  openHelp() {}

  reset(stepper: MatStepper) {
    stepper.reset();
    this.answers = {};
    this.removedCache.clear();
    this.elements.length = 0;
    this.createdIndexes.length = 0;
    this.verify(-1);
  }

  protected submit() {
    this.dialogRef.close(this.answers);
  }

  private close() {
    this.dialogRef.close();
  }

  private verify(elementIndex: number) {
    const first = this.createdIndexes[elementIndex++] ?? -1;
    const questions = this.data.questions;
    this.remaining[0] = questions.length - first - 1;
    this.remaining[1] = 0;
    for (let i = first + 1; i < questions.length; i++) {
      const question = questions[i];
      const isActive = !question.active || question.active(this.answers);
      const isMounted = this.createdIndexes[elementIndex] === i;
      this.remaining[1] += isActive ? 1 : 0;
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
  }
}
