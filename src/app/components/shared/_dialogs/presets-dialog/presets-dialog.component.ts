import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { title } from 'process';

@Component({
  selector: 'app-presets-dialog',
  templateUrl: './presets-dialog.component.html',
  styleUrls: ['./presets-dialog.component.scss'],
})
export class PresetsDialogComponent implements OnInit {
  @Input() title: string;
  @Input() label: string;
  @Input() placeholder: string;
  presetsDefinitionFormControl = new FormControl('', [
    this.validateTextLength.bind(this),
  ]);
  presetsDefinitionLength: number = 0;
  isLoading = true;
  readonly maxLength = 100;
  constructor(private dialogRef: MatDialogRef<PresetsDialogComponent>) {}

  public static open(
    dialog: MatDialog,
    title: string,
    label: string,
    placeholder,
  ) {
    const ref = dialog.open(PresetsDialogComponent, {
      minWidth: '500px',
    });
    ref.componentInstance.title = title;
    ref.componentInstance.label = label;
    ref.componentInstance.placeholder = placeholder;
    return ref;
  }

  ngOnInit(): void {
    this.isLoading = false;
  }

  buildConfirmAction() {
    if (this.isLoading) {
      return undefined;
    }
    return () => {
      if (!this.presetsDefinitionFormControl.valid) {
        return;
      }
      this.dialogRef.close();
    };
  }
  buildCancelAction() {
    return () => {
      this.dialogRef.close();
    };
  }
  validateTextLength(): any {
    //return this.presetsDefinitionFormControl.value.length
  }
}
