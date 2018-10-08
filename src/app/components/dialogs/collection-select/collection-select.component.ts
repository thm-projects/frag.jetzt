import { Component, Inject, OnInit } from '@angular/core';
import { RoomService } from '../../../services/http/room.service';
import { Room } from '../../../models/room';
import { Router } from '@angular/router';
import { NotificationService } from '../../../services/util/notification.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { FormControl } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { ContentText } from '../../../models/content-text';
import { ContentService } from '../../../services/http/content.service';

@Component({
  selector: 'app-collection-select',
  templateUrl: './collection-select.component.html',
  styleUrls: ['./collection-select.component.scss']
})
export class CollectionSelectComponent implements OnInit {

  name: string;
  room: Room;
  content: ContentText;
  roomId: string;
  collections: string[] = ['ARSnova', 'Angular', 'HTML', 'TypeScript' ];
  myControl = new FormControl();
  filteredOptions: Observable<string[]>;

  constructor(private roomService: RoomService,
              private contentService: ContentService,
              private router: Router,
              private notificationService: NotificationService,
              public dialogRef: MatDialogRef<CollectionSelectComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
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
    this.notificationService.show('Content submitted. Ready for creation of new content.');
  }

  submitContent(subject: string, body: string) {
    this.contentService.addContent(new ContentText(
      '1',
      '1',
      this.roomId,
      subject,
      body,
      1,
      [],
    )).subscribe();
    if (this.content.body.valueOf() === '' || this.content.body.valueOf() === '') {
      this.notificationService.show('No empty fields allowed. Please check subject and body.');
      return;
    }
    this.notificationService.show('Content submitted.');
    this.resetAfterSubmit();
  }
}
