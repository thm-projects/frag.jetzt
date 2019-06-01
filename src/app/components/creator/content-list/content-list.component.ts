import { Component, OnInit } from '@angular/core';
import { ContentService } from '../../../services/http/content.service';
import { Content } from '../../../models/content';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { ContentChoice } from '../../../models/content-choice';
import { ContentText } from '../../../models/content-text';
import { ContentType } from '../../../models/content-type.enum';
import { ContentGroup } from '../../../models/content-group';
import { MatDialog } from '@angular/material';
import { NotificationService } from '../../../services/util/notification.service';
import { Room } from '../../../models/room';
import { RoomService } from '../../../services/http/room.service';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { ContentDeleteComponent } from '../_dialogs/content-delete/content-delete.component';
import { ContentEditComponent } from '../_dialogs/content-edit/content-edit.component';

@Component({
  selector: 'app-content-list',
  templateUrl: './content-list.component.html',
  styleUrls: ['./content-list.component.scss']
})


export class ContentListComponent implements OnInit {

  contents: Content[];
  contentBackup: Content;
  contentCBackup: ContentChoice;
  roomId: string;
  contentGroup: ContentGroup;
  room: Room;
  isLoading = true;
  collectionName: string;
  labelMaxLength: number;
  labels: string[] = [];
  deviceType = localStorage.getItem('deviceType');

  constructor(private contentService: ContentService,
              private roomService: RoomService,
              private route: ActivatedRoute,
              private location: Location,
              private notificationService: NotificationService,
              public dialog: MatDialog,
              private translateService: TranslateService,
              protected langService: LanguageService) {
    langService.langEmitter.subscribe(lang => translateService.use(lang));
  }

  ngOnInit() {
    this.labelMaxLength = innerWidth / 20;
    this.roomId = localStorage.getItem(`roomId`);
    this.roomService.getRoom(this.roomId).subscribe(room => {
      this.room = room;
      this.roomId = room.shortId;
    });
    this.contentGroup = JSON.parse(sessionStorage.getItem('contentGroup'));
    this.contentService.getContentsByIds(this.contentGroup.contentIds).subscribe( contents => {
      this.contents = contents;
      for (let i = 0; i < this.contents.length; i++) {
        if (this.contents[i].subject.length > this.labelMaxLength) {
          this.labels[i] = this.contents[i].subject.substr(0, this.labelMaxLength) + '..';
        } else {
          this.labels[i] = this.contents[i].subject;
        }
      }
      this.isLoading = false;
    });
    this.route.params.subscribe(params => {
      sessionStorage.setItem('collection', params['contentGroup']);
      this.collectionName = params['contentGroup'];
    });
    this.translateService.use(localStorage.getItem('currentLang'));
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
    this.contentCBackup = new ContentChoice(
      content.id,
      content.revision,
      content.roomId,
      content.subject,
      content.body,
      content.round,
      content.groups,
      content.options,
      content.correctOptionIndexes,
      content.multiple,
      content.format
    );
  }

  createTextContentBackup(content: ContentText) {
    this.contentBackup = new ContentText(
      content.id,
      content.revision,
      content.roomId,
      content.subject,
      content.body,
      content.round,
      [],
    );
  }

  deleteContent(delContent: Content) {
    const index = this.findIndexOfSubject(delContent.subject);
    this.createChoiceContentBackup(delContent as ContentChoice);
    const dialogRef = this.dialog.open(ContentDeleteComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.content = delContent;
    dialogRef.afterClosed()
      .subscribe(result => {
        this.updateContentChanges(index, result);
      });
  }

  editContent(edContent: Content) {
    if (edContent.format === ContentType.TEXT) {
      this.createTextContentBackup(edContent as ContentText);
    } else {
      this.createChoiceContentBackup(edContent as ContentChoice);
    }
    const index = this.findIndexOfSubject(edContent.subject);
    const dialogRef = this.dialog.open(ContentEditComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.content = this.contentCBackup;
    dialogRef.afterClosed()
      .subscribe(result => {
        this.updateContentChanges(index, result);
      });
  }

  updateContentChanges(index: number, action: string) {
    if (!action) {
      this.contents[index] = this.contentCBackup;
    } else {
      switch (action.valueOf()) {
        case 'delete':
          this.translateService.get('content.content-deleted').subscribe(message => {
            this.notificationService.show(message);
          });
          this.contentService.deleteContent(this.contents[index].id).subscribe();
          this.contents.splice(index, 1);
          if (this.contents.length === 0) {
            this.location.back();
          }
          break;
        case 'update':
          this.contents[index] = this.contentCBackup;
          this.contentService.updateContent(this.contents[index]).subscribe();
          this.translateService.get('content.content-updated').subscribe(message => {
            this.notificationService.show(message);
          });
          break;
        case 'abort':
          this.contents[index] = this.contentCBackup;
          break;
      }
    }
  }
}
