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
  label: string;
  placeholder: string;
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
    });
  }

  setPresetsStrings() {
    this.title = 'presets-dialog.title';
    switch (this.type) {
      case PresetsDialogType.CONTEXT:
        this.label = 'presets-dialog.context-label';
        this.placeholder = 'presets-dialog.context-placeholder';
        break;
      case PresetsDialogType.PERSONA:
        this.label = 'presets-dialog.persona-label';
        this.placeholder = 'presets-dialog.persona-placeholder';
        break;
      case PresetsDialogType.TOPIC:
        this.label = 'presets-dialog.topic-label';
        this.placeholder = 'presets-dialog.topic-placeholder';
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
}
