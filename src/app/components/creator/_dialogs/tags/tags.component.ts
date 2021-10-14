import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { RoomCreatorPageComponent } from '../../room-creator-page/room-creator-page.component';
import { LanguageService } from '../../../../services/util/language.service';
import { FormControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tags',
  templateUrl: './tags.component.html',
  styleUrls: ['./tags.component.scss']
})
export class TagsComponent {

  tags: string[];
  tagFormControl = new FormControl('', [
    Validators.minLength(3), Validators.maxLength(20)
  ]);
  private _closeSubscription: Subscription;

  constructor(public dialogRef: MatDialogRef<RoomCreatorPageComponent>,
              public translationService: TranslateService,
              protected langService: LanguageService) {
    langService.langEmitter.subscribe(lang => translationService.use(lang));
    this._closeSubscription = this.dialogRef.beforeClosed().subscribe(() => this.closeDialog());
  }

  addTag(tag: string) {
    tag = tag.trim();
    this.tagFormControl.setValue(tag);
    if (this.tagFormControl.valid && tag.length > 0 && !this.tags.includes(tag)) {
      this.tags.push(tag);
      this.tagFormControl.setValue('');
    }
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
