import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-brainstorming-category-editor',
  templateUrl: './brainstorming-category-editor.component.html',
  styleUrls: ['./brainstorming-category-editor.component.scss'],
  standalone: false,
})
export class BrainstormingCategoryEditorComponent {
  readonly max = 40;
  readonly min = 3;
  displayEmptyOnCreateWarning = false;
  tags: string[];
  tagFormControl = new FormControl('', [
    Validators.minLength(this.min),
    Validators.maxLength(this.max),
    this.emptyOnCreate.bind(this),
  ]);

  constructor() {}

  emptyOnCreate(control: FormControl) {
    if (this.displayEmptyOnCreateWarning && control.value.trim() === '') {
      return {
        emptyOnCreate: {
          valid: false,
        },
      };
    }
    return null;
  }

  addTag(tag: string) {
    this.displayEmptyOnCreateWarning = true;
    tag = tag.trim();
    this.tagFormControl.setValue(tag);
    if (
      this.tagFormControl.valid &&
      tag.length > 0 &&
      !this.tags.includes(tag)
    ) {
      this.tags.push(tag);
      this.tagFormControl.setValue('');
      this.displayEmptyOnCreateWarning = false;
      this.tagFormControl.updateValueAndValidity();
    }
    this.displayEmptyOnCreateWarning = false;
  }

  deleteTag(tag: string) {
    this.tags = this.tags.filter((o) => o !== tag);
  }
}
