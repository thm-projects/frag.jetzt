import { Component, Input, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

export enum PresetsDialogType {
  CONTEXT = 'CONTEXT',
  ROLE_INSTRUCTION = 'ROLE_INSTRUCTION',
}

@Component({
  selector: 'app-presets-dialog',
  templateUrl: './presets-dialog.component.html',
  styleUrls: ['./presets-dialog.component.scss'],
  standalone: false,
})
export class PresetsDialogComponent implements OnInit {
  @Input() type: PresetsDialogType;
  @Input() data: string[];
  presetsDefinitionLength: number = 0;
  isLoading = true;
  title: string[] = [];
  labels: string[] = [];
  placeholders: string[] = [];
  readonly presetsDefinitionMin = 2;
  presetsDefinitionMax = 100;
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
    this.presetsDefinitionMax =
      this.type === PresetsDialogType.ROLE_INSTRUCTION ? 2000 : 100;
    this.data.forEach((item) => {
      this.formControls.push(
        new FormControl(item, [
          Validators.minLength(this.presetsDefinitionMin),
          Validators.maxLength(this.presetsDefinitionMax),
        ]),
      );
      this.labels.push('');
      this.placeholders.push('');
      this.title.push('');
    });
  }

  setPresetsStrings() {
    // this.title = 'presets-dialog.title';

    switch (this.type) {
      case PresetsDialogType.CONTEXT:
        this.title[0] = 'presets-dialog.context-title';
        this.labels[0] = 'presets-dialog.context-label';
        this.placeholders[0] = 'presets-dialog.context-placeholder';
        break;
      case PresetsDialogType.ROLE_INSTRUCTION:
        this.title[0] = 'presets-dialog.role-instruction-title';
        this.labels[0] = 'presets-dialog.role-instruction-label';
        this.placeholders[0] = 'presets-dialog.role-instruction-placeholder';
        break;
    }
  }

  confirm() {
    if (this.isLoading) {
      return;
    }
    if (!this.formControls.every((control) => control.valid)) {
      return;
    }
    this.formControls.forEach(
      (control, index) => (this.data[index] = control.value),
    );
    this.dialogRef.close(this.data);
  }

  clear(index: number) {
    this.formControls[index].setValue('');
  }
}
