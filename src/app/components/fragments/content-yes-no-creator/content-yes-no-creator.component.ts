import { Component, Inject, OnInit } from '@angular/core';
import { ContentChoice } from '../../../models/content-choice';
import { DisplayAnswer } from '../content-choice-creator/content-choice-creator.component';
import { AnswerOption } from '../../../models/answer-option';
import { NotificationService } from '../../../services/util/notification.service';
import { ContentType } from '../../../models/content-type.enum';
import { ContentService } from '../../../services/http/content.service';
import { ActivatedRoute } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { ContentListComponent } from '../content-list/content-list.component';
import { ContentDeleteComponent } from '../../dialogs/content-delete/content-delete.component';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-content-yes-no-creator',
  templateUrl: './content-yes-no-creator.component.html',
  styleUrls: ['./content-yes-no-creator.component.scss']
})
export class ContentYesNoCreatorComponent implements OnInit {
  yesno = true;
  answerLabels = [
    'Ja',
    'Nein'
  ];
  content: ContentChoice = new ContentChoice(
    '0',
    '1',
    '',
    '',
    '',
    1,
    [],
    [],
    [],
    false,
    ContentType.BINARY
  );

  roomId: string;

  displayAnswers: DisplayAnswer[] = [];
  newAnswerOptionPoints = '';
  collections: string[] = ['ARSnova', 'Angular', 'HTML', 'TypeScript' ];
  myControl = new FormControl();
  filteredOptions: Observable<string[]>;
  lastCollection: string;

  editDialogMode = false;

  constructor(private contentService: ContentService,
              private route: ActivatedRoute,
              private notificationService: NotificationService,
              public dialog: MatDialog,
              public dialogRef: MatDialogRef<ContentListComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit() {
    this.roomId = localStorage.getItem(`roomId`);
    for (let i = 0; i < this.answerLabels.length; i++) {
      this.content.options.push(new AnswerOption(this.answerLabels[i], this.newAnswerOptionPoints));
    }
    this.fillCorrectAnswers();
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

  fillCorrectAnswers() {
    this.displayAnswers = [];
    for (let i = 0; i < this.content.options.length; i++) {
      this.displayAnswers.push(new DisplayAnswer(this.content.options[i], this.content.correctOptionIndexes.includes(i)));
    }
  }

  resetAfterSubmit() {
    this.content.subject = '';
    this.content.body = '';
    this.content.correctOptionIndexes = [];
    this.fillCorrectAnswers();
    this.notificationService.show('Content submitted. Ready for creation of new content.');
  }

  submitContent(subject: string, body: string, group: string): void {
    if (subject.valueOf() === '' || body.valueOf() === '') {
      this.notificationService.show('No empty fields allowed. Please check subject and body.');
      return;
    }
    this.notificationService.show('Content sumbitted.');
    if (this.yesno) {
      this.content.correctOptionIndexes = [0];
    } else {
      this.content.correctOptionIndexes = [1];
    }
    this.contentService.addContent(new ContentChoice(
      '',
      '',
      this.roomId,
      subject,
      body,
      1,
      [group],
      this.content.options,
      this.content.correctOptionIndexes,
      this.content.multiple,
      ContentType.BINARY
    )).subscribe();
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
