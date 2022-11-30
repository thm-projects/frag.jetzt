import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-brainstorming-category-editor',
  templateUrl: './brainstorming-category-editor.component.html',
  styleUrls: ['./brainstorming-category-editor.component.scss']
})
export class BrainstormingCategoryEditorComponent implements OnInit {

  displayEmptyOnCreateWarning = false;
  tags: string[];
  tagFormControl = new FormControl('', [
    Validators.minLength(3), Validators.maxLength(40), this.emptyOnCreate.bind(this)
  ]);

  constructor(
    private dialogRef: MatDialogRef<BrainstormingCategoryEditorComponent>,
  ) { }

  ngOnInit(): void {
  }

  emptyOnCreate(control: FormControl) {
    if (this.displayEmptyOnCreateWarning && control.value.trim() === '') {
      return {
        emptyOnCreate: {
          valid: false
        }
      };
    }
    return null;
  }

  getErrorMessage() {
    if (this.tagFormControl.hasError('minlength') || this.tagFormControl.hasError('maxlength')) {
      return 'room-page.tag-error-length';
    }
    if (this.tagFormControl.hasError('emptyOnCreate')) {
      return 'room-page.tag-error-empty';
    }
  }

  addTag(tag: string) {
    this.displayEmptyOnCreateWarning = true;
    tag = tag.trim();
    this.tagFormControl.setValue(tag);
    if (this.tagFormControl.valid && tag.length > 0 && !this.tags.includes(tag)) {
      this.tags.push(tag);
      this.tagFormControl.setValue('');
      this.displayEmptyOnCreateWarning = false;
      this.tagFormControl.updateValueAndValidity();
    }
    this.displayEmptyOnCreateWarning = false;
  }

  deleteTag(tag: string) {
    this.tags = this.tags.filter(o => o !== tag);
  }

  closeDialog(): void {
    this.dialogRef.close(this.tags);
  }

  buildSaveActionCallback(): () => void {
    return () => {
      this.closeDialog();
    };
  }

}
