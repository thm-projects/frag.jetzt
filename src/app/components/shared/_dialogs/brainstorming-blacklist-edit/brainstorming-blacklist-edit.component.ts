import { Component, Input, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Room } from 'app/models/room';
import { RoomService } from 'app/services/http/room.service';
import { TagCloudSettings } from 'app/utils/TagCloudSettings';

@Component({
  selector: 'app-brainstorming-blacklist-edit',
  templateUrl: './brainstorming-blacklist-edit.component.html',
  styleUrls: ['./brainstorming-blacklist-edit.component.scss'],
})
export class BrainstormingBlacklistEditComponent implements OnInit {
  @Input() room: Room;
  blacklist: string[];
  showBlacklistWordList = false;
  newBlacklistWord: string;

  constructor(
    private _roomService: RoomService,
    private _dialogRef: MatDialogRef<BrainstormingBlacklistEditComponent>,
  ) {}

  ngOnInit(): void {
    this.blacklist =
      TagCloudSettings.getFromRoom(this.room)?.brainstormingBlacklist || [];
    this.blacklist.sort();
  }

  addBlacklistWord() {
    this.blacklist.push(this.newBlacklistWord.toLowerCase());
    this.newBlacklistWord = '';
    this.blacklist.sort();
  }

  removeWordFromBlacklist(tag) {
    const index = this.blacklist.indexOf(tag);
    if (index < 0) {
      return;
    }
    this.blacklist.splice(index, 1);
  }

  buildCloseDialogActionCallback() {
    return () => {
      this._dialogRef.close();
    };
  }

  buildSaveActionCallback() {
    return () => {
      const settings = TagCloudSettings.getFromRoom(this.room);
      settings.brainstormingBlacklist = this.blacklist;
      this._roomService
        .patchRoom(this.room.id, {
          tagCloudSettings: settings.serialize(),
        })
        .subscribe();
      this._dialogRef.close(this.blacklist);
    };
  }
}
