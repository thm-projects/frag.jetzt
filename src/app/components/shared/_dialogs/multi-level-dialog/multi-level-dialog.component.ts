import { Component, Input, OnInit } from '@angular/core';
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

  constructor(private dialogRef: MatDialogRef<MultiLevelDialogComponent>) {}

  public static open(dialog: MatDialog, data: MultiLevelData) {
    const dialogRef = dialog.open(MultiLevelDialogComponent, {
      maxWidth: '99vw',
      maxHeight: '99vh',
    });
    dialogRef.componentInstance.data = data;
    return dialogRef;
  }

  ngOnInit(): void {
    this.generateNextElements();
  }

  checkIt(index: number, stepper: MatStepper) {
    const group = this.elements[index].group;
    group.markAllAsTouched();
    if (group.invalid) {
      return;
    }
    if (index < this.elements.length - 1) {
      this.verify(index);
      stepper.next();
      return;
    }
    this.generateNextElements();
    requestAnimationFrame(() => {
      stepper.next();
    });
  }

  openHelp() {}

  protected submit() {
    this.dialogRef.close();
  }

  private close() {
    this.dialogRef.close();
  }

  private verify(start: number) {
    for (let i = this.elements.length - 1; i > start; i--) {
      const questionIndex = this.createdIndexes[i];
      const question = this.data.questions[questionIndex];
      if (question.active && !question.active(this.answers)) {
        this.elements.splice(i, 1);
        this.createdIndexes.splice(i, 1);
        delete this.answers[question.tag];
      }
    }
  }

  private generateNextElements() {
    const last = this.createdIndexes[this.createdIndexes.length - 1] ?? -1;
    let i = last + 1;
    for (; i < this.data.questions.length; i++) {
      const question = this.data.questions[i];
      if (question.active && !question.active(this.answers)) {
        break;
      }
      const element = question.buildAction(this.answers);
      this.elements.push(element);
      this.createdIndexes.push(i);
      this.answers[question.tag] = element.group;
    }
    // update remaining answers
    if (i === last + 1) {
      i += 1;
    }
    let uncond = 0;
    let cond = 0;
    for (; i < this.data.questions.length; i++) {
      uncond++;
      const question = this.data.questions[i];
      if (question.active && !question.active(this.answers)) {
        break;
      }
      cond++;
    }
    console.log(uncond, cond, i);
    this.remaining = [uncond, cond];
  }
}
