import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { NotificationService } from '../../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { RoomCreatorPageComponent } from '../../room-creator-page/room-creator-page.component';
import { LanguageService } from '../../../../services/util/language.service';
import { EventService } from '../../../../services/util/event.service';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-tags',
  templateUrl: './tags.component.html',
  styleUrls: ['./tags.component.scss']
})
export class TagsComponent implements OnInit {

  extension: {};

  tags: string[];
  tagsEnabled: boolean;

  tagFormControl = new FormControl('', [Validators.minLength(3), Validators.maxLength(15)]);
  @ViewChild('tag') redel: ElementRef;

  constructor(public dialogRef: MatDialogRef<RoomCreatorPageComponent>,
    public dialog: MatDialog,
    public notificationService: NotificationService,
    public translationService: TranslateService,
    protected langService: LanguageService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public eventService: EventService) {
      langService.langEmitter.subscribe(lang => translationService.use(lang));
  }

  ngOnInit() {
    if (!this.extension) {
      this.extension = {};
      this.extension['enableTags'] = true;
      this.tags = [];
      this.tagsEnabled = true;
    } else {
      if (this.extension['tags']) {
        this.tags = this.extension['tags'];
      } else {
        this.tags = [];
      }
      this.tagsEnabled = this.extension['enableTags'];
    }
  }

  addTag(tag: string) {
    if (this.tagFormControl.valid) {
      this.tags.push(tag);
      this.extension['tags'] = this.tags;
      this.redel.nativeElement.value = '';
    }
  }

  deleteTag(tag: string) {
    this.tags = this.tags.filter(o => o !== tag);
    this.extension['tags'] = this.tags;
  }

  closeDialog(): void {
    this.dialogRef.close(this.extension);
  }


  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildCloseDialogActionCallback(): () => void {
    return () => this.dialogRef.close('abort');
  }


  /**
   * Returns a lambda which executes the dialog dedicated action on call.
   */
  buildSaveActionCallback(): () => void {
    return () => this.closeDialog();
  }
}
