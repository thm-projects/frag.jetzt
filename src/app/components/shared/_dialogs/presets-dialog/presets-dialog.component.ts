import { Component, Input, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

export enum PresetsDialogType {
  CONTEXT = 'CONTEXT',
  PERSONA = 'PERSONA',
  TOPIC = 'TOPIC',
}

@Component({
  selector: 'app-presets-dialog',
  templateUrl: './presets-dialog.component.html',
  styleUrls: ['./presets-dialog.component.scss'],
})
export class PresetsDialogComponent implements OnInit {
  @Input() type: PresetsDialogType;
  @Input() data: string[];
  presetsDefinitionLength: number = 0;
  isLoading = true;
  title: string;
  labels: string[] = [];
  placeholders: string[] = [];
  readonly presetsDefinitionMin = 2;
  readonly presetsDefinitionMax = 100;
  formControls = [];
  constructor(private dialogRef: MatDialogRef<PresetsDialogComponent>) {}

  public static open(dialog: MatDialog, type: PresetsDialogType) {
    const ref = dialog.open(PresetsDialogComponent, {
      minWidth: '500px',
    });
    ref.componentInstance.type = type;
    return ref;
  }

  ngOnInit(): void {
    this.isLoading = false;
    this.setPresetsStrings();
    this.data.forEach((item) => {
      this.formControls.push(
        new FormControl(item, [
          Validators.minLength(this.presetsDefinitionMin),
          Validators.maxLength(this.presetsDefinitionMax),
        ]),
      );
      this.labels.push('');
      this.placeholders.push('');
    });
  }

  setPresetsStrings() {
    this.title = 'presets-dialog.title';
    switch (this.type) {
      case PresetsDialogType.CONTEXT:
        this.labels[0] = 'presets-dialog.context-label';
        this.placeholders[0] = 'presets-dialog.context-placeholder';
        break;
      case PresetsDialogType.PERSONA:
        this.labels[0] = 'presets-dialog.persona-moderator-label';
        this.labels[1] = 'presets-dialog.persona-user-label';
        this.labels[2] = 'presets-dialog.persona-creator-label';
        this.placeholders[0] = 'presets-dialog.persona-moderator-placeholder';
        this.placeholders[1] = 'presets-dialog.persona-user-placeholder';
        this.placeholders[2] = 'presets-dialog.persona-creator-placeholder';
        break;
      case PresetsDialogType.TOPIC:
        this.labels[0] = 'presets-dialog.topic-label';
        this.placeholders[0] = 'presets-dialog.topic-placeholder';
        break;
    }
  }

  buildConfirmAction() {
    if (this.isLoading) {
      return undefined;
    }
    return () => {
      if (!this.formControls.every((control) => control.valid)) {
        return;
      }
      this.formControls.forEach(
        (control, index) => (this.data[index] = control.value),
      );
      this.dialogRef.close(this.data);
    };
  }
  buildCancelAction() {
    return () => {
      this.dialogRef.close();
    };
  }
  clear(index: number) {
    this.formControls[index].setValue('');
  }
}
