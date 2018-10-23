import { Component, Inject, OnInit } from '@angular/core';
import { ContentText } from '../../../models/content-text';
import { ContentService } from '../../../services/http/content.service';
import { NotificationService } from '../../../services/util/notification.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { ContentListComponent } from '../content-list/content-list.component';
import { ContentDeleteComponent } from '../../dialogs/content-delete/content-delete.component';
import { map, startWith } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-content-text-creator',
  templateUrl: './content-text-creator.component.html',
  styleUrls: ['./content-text-creator.component.scss']
})
export class ContentTextCreatorComponent implements OnInit {

  roomId: string;
  content: ContentText = new ContentText(
    '1',
    '1',
    '0',
    '',
    '',
    1,
    [],
  );
  collections: string[] = ['ARSnova', 'Angular', 'HTML', 'TypeScript' ];
  myControl = new FormControl();
  filteredOptions: Observable<string[]>;
  lastCollection: string;

  editDialogMode = false;

  constructor(private contentService: ContentService,
              private notificationService: NotificationService,
              public dialog: MatDialog,
              public dialogRef: MatDialogRef<ContentListComponent>,
              private translationService: TranslateService,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit() {
    this.roomId = localStorage.getItem(`roomId`);
    this.lastCollection = sessionStorage.getItem('collection');
    this.filteredOptions = this.myControl.valueChanges
      .pipe(
        startWith(''),
        map(value => this._filter(value))
      );
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.collections.filter(collection => collection.toLowerCase().includes(filterValue));
  }

  resetAfterSubmit() {
    this.content.subject = '';
    this.content.body = '';
    this.translationService.get('content.submitted').subscribe(message => {
      this.notificationService.show(message);
    });
  }

  submitContent(subject: string, body: string, group: string) {
    this.contentService.addContent(new ContentText(
      '1',
      '1',
      this.roomId,
      subject,
      body,
      1,
      [group],
    )).subscribe();
    if (this.content.body.valueOf() === '' || this.content.body.valueOf() === '') {
      this.translationService.get('content.no-empty').subscribe(message => {
        this.notificationService.show(message);
      });
      return;
    }
    sessionStorage.setItem('collection', group);
    this.resetAfterSubmit();
  }

  editDialogClose($event, action: string) {
    $event.preventDefault();
    this.dialogRef.close(action);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  openDeletionContentDialog($event): void {
    $event.preventDefault();
    const dialogRef = this.dialog.open(ContentDeleteComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.content = this.content;
    dialogRef.afterClosed()
      .subscribe(result => {
        if (result === 'delete') {
          this.dialogRef.close(result);
        }
      });
  }
}
