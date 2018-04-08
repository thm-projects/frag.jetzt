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

@Component({
  selector: 'app-content-list',
  templateUrl: './content-list.component.html',
  styleUrls: ['./content-list.component.scss']
})
export class ContentListComponent implements OnInit {
  //  contents: Content[];
  contents = [
    new ContentChoice('0',
      '1',
      'roomId1',
      'MultipleChoice Subject',
      'MultipleChoice Body',
      1,
      [new AnswerOption('yes', ''), new AnswerOption('no', '')],
      [],
      true,
      ContentType.CHOICE),
    new ContentChoice('0',
      '1',
      'roomId2',
      'SingleChoice Subject',
      'SingleChoice Body',
      1,
      [new AnswerOption('may', ''), new AnswerOption('not', '')],
      [],
      false,
      ContentType.BINARY),
    new ContentText('1',
      '1',
      'roomId3',
      'TextContent Subject',
      'TextContent Body',
      1),
    new ContentChoice('0',
      '1',
      'roomId4',
      'LikertContent Subject',
      'LikertContent Body',
      1,
      [
        new AnswerOption('Strongly agree', '0'),
        new AnswerOption('Agree', '0'),
        new AnswerOption('Neither agree nor disagree', '0'),
        new AnswerOption('Disagree', '0'),
        new AnswerOption('Strongly disagree', '0')],
      [],
      false,
      ContentType.SCALE)
  ];

  ContentType: typeof ContentType = ContentType;

  constructor(private contentService: ContentService,
              private route: ActivatedRoute,
              public dialog: MatDialog) {
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
//      this.getContents(params['roomId']);
    });
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

  editContent(subject: string) {
    const index = this.findIndexOfSubject(subject);
    const format = this.contents[index].format;

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
      dialogRef.componentInstance.multipleChoice = true;
    } else {
      dialogRef.componentInstance.multipleChoice = false;
      dialogRef.componentInstance.singleChoice = true;
    }
    dialogRef.componentInstance.editDialogMode = true;
    dialogRef.componentInstance.content = content;
    dialogRef.afterClosed()
      .subscribe(result => {
        console.log(result);
      });
  }

  editBinaryContentDialog(index: number, content: ContentChoice) {
    const dialogRef = this.dialog.open(ContentChoiceCreatorComponent, {
      width: '800px'
    });
    dialogRef.componentInstance.editDialogMode = true;
    dialogRef.componentInstance.multipleChoice = false;
    dialogRef.componentInstance.singleChoice = true;
    dialogRef.componentInstance.content = content;
    dialogRef.afterClosed()
      .subscribe(result => {
        console.log(result);
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
        console.log(result);
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
        console.log(result);
      });
  }
}
