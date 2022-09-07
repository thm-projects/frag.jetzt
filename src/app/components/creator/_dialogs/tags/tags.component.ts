import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { RoomCreatorPageComponent } from '../../room-creator-page/room-creator-page.component';
import { FormControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tags',
  templateUrl: './tags.component.html',
  styleUrls: ['./tags.component.scss']
})
export class TagsComponent {
  displayEmptyOnCreateWarning = false;
  tags: string[];
  tagFormControl = new FormControl('', [
    Validators.minLength(3), Validators.maxLength(20), this.emptyOnCreate.bind(this)
  ]);
  private _closeSubscription: Subscription;

  constructor(
    public dialogRef: MatDialogRef<RoomCreatorPageComponent>,
  ) {
    this._closeSubscription = this.dialogRef.beforeClosed().subscribe(() => this.closeDialog());
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
      this._closeSubscription.unsubscribe();
      this.closeDialog();
    };
  }
}
