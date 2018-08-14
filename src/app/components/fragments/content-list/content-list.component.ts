import { Component, OnInit } from '@angular/core';
import { ContentService } from '../../../services/http/content.service';
import { Content } from '../../../models/content';
import { ActivatedRoute } from '@angular/router';
import { ContentChoice } from '../../../models/content-choice';
import { ContentText } from '../../../models/content-text';
import { AnswerOption } from '../../../models/answer-option';
import { ContentType } from '../../../models/content-type.enum';
import { MatDialog } from '@angular/material';
import { ContentChoiceCreatorComponent } from '../content-choice-creator/content-choice-creator.component';
import { ContentLikertCreatorComponent } from '../content-likert-creator/content-likert-creator.component';
import { ContentTextCreatorComponent } from '../content-text-creator/content-text-creator.component';
import { NotificationService } from '../../../services/util/notification.service';

@Component({
  selector: 'app-content-list',
  templateUrl: './content-list.component.html',
  styleUrls: ['./content-list.component.scss']
})
export class ContentListComponent implements OnInit {

  contents = [];

  contentBackup: Content;

  ContentType: typeof ContentType = ContentType;

  roomId: string;

  constructor(private contentService: ContentService,
              private route: ActivatedRoute,
              private notificationService: NotificationService,
              public dialog: MatDialog) {
  }

  ngOnInit() {
    this.roomId = localStorage.getItem(`roomId`);
    this.getContents(this.roomId);
  }

  getContents(roomId: string): void {
    this.contentService.getContents(roomId)
      .subscribe(contents => {
        this.contents = contents;
      });
  }

  findIndexOfSubject(subject: string): number {
    let index = -1;
    for (let i = 0; i < this.contents.length; i++) {
      if (this.contents[i].subject.valueOf() === subject.valueOf()) {
        index = i;
        break;
      }
    }
    return index;
  }

  createChoiceContentBackup(content: ContentChoice) {
    const answerOptions: Array<AnswerOption> = new Array<AnswerOption> ();
    const correctAnswers: number[] = [];

    for (let i = 0; i < content.options.length; i++) {
      answerOptions.push(content.options[i]);
    }

    for (let i = 0; i < content.correctOptionIndexes.length; i++) {
      correctAnswers.push(content.correctOptionIndexes[i]);
    }

    this.contentBackup = new ContentChoice(
      content.contentId,
      content.revision,
      content.roomId,
      content.subject,
      content.body,
      content.round,
      [],
      answerOptions,
      correctAnswers,
      content.multiple,
      content.format
    );
  }

  createTextContentBackup(content: ContentText) {
    this.contentBackup = new ContentText(
      content.contentId,
      content.revision,
      content.roomId,
      content.subject,
      content.body,
      content.round,
      [],
    );
  }

  editContent(subject: string) {
    const index = this.findIndexOfSubject(subject);
    const format = this.contents[index].format;

    if (format === this.ContentType.TEXT) {
      this.createTextContentBackup(this.contents[index] as ContentText);
    } else {
      this.createChoiceContentBackup(this.contents[index] as ContentChoice);
    }

    switch (format) {
      case this.ContentType.CHOICE:
        this.editChoiceContentDialog(index, this.contents[index] as ContentChoice);
        break;
      case this.ContentType.BINARY:
        this.editBinaryContentDialog(index, this.contents[index] as ContentChoice);
        break;
      case this.ContentType.SCALE:
        this.editLikertContentDialog(index, this.contents[index] as ContentChoice);
        break;
      case this.ContentType.TEXT:
        this.editTextContentDialog(index, this.contents[index] as ContentText);
        break;
        default:
          return;
    }
  }

  editChoiceContentDialog(index: number, content: ContentChoice) {
    const dialogRef = this.dialog.open(ContentChoiceCreatorComponent, {
      width: '800px'
    });
    if (content.multiple) {
      dialogRef.componentInstance.singleChoice = false;
    } else {
      dialogRef.componentInstance.singleChoice = true;
    }
    dialogRef.componentInstance.editDialogMode = true;
    dialogRef.componentInstance.content = content;
    dialogRef.afterClosed()
      .subscribe(result => {
        this.updateContentChanges(index, result);
      });
  }

  editBinaryContentDialog(index: number, content: ContentChoice) {
    const dialogRef = this.dialog.open(ContentChoiceCreatorComponent, {
      width: '800px'
    });
    dialogRef.componentInstance.editDialogMode = true;
    dialogRef.componentInstance.singleChoice = true;
    dialogRef.componentInstance.content = content;
    dialogRef.afterClosed()
      .subscribe(result => {
        this.updateContentChanges(index, result);
      });
  }

  editLikertContentDialog(index: number, content: ContentChoice) {
    const dialogRef = this.dialog.open(ContentLikertCreatorComponent, {
      width: '800px'
    });
    dialogRef.componentInstance.editDialogMode = true;
    dialogRef.componentInstance.content = content;
    dialogRef.afterClosed()
      .subscribe(result => {
        this.updateContentChanges(index, result);
      });
  }

  editTextContentDialog(index: number, content: ContentText) {
    const dialogRef = this.dialog.open(ContentTextCreatorComponent, {
      width: '800px'
    });
    dialogRef.componentInstance.editDialogMode = true;
    dialogRef.componentInstance.content = content;
    dialogRef.afterClosed()
      .subscribe(result => {
        this.updateContentChanges(index, result);
      });
  }

  updateContentChanges(index: number, action: string) {
    if (!action) {
      this.contents[index] = this.contentBackup;
    } else {
      if (action.valueOf() === 'delete') {
        this.notificationService.show('Content "' + this.contents[index].subject + '" deleted.');
        this.contentService.deleteContent(this.contents[index].contentId);
        this.contents.splice(index, 1);
      }
      if (action.valueOf() === 'edit') {
        this.notificationService.show('Content "' + this.contents[index].subject + '" updated.');
        this.contentService.updateContent(this.contents[index]);
      }
      if (action.valueOf() === 'abort') {
        this.contents[index] = this.contentBackup;
      }
    }
  }
}
