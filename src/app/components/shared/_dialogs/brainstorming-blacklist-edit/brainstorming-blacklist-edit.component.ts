import { Component, Input, OnInit } from '@angular/core';
import { BrainstormingWord } from 'app/models/brainstorming-word';
import { Room } from 'app/models/room';
import { BrainstormingService } from 'app/services/http/brainstorming.service';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-brainstorming-blacklist-edit',
  templateUrl: './brainstorming-blacklist-edit.component.html',
  styleUrls: ['./brainstorming-blacklist-edit.component.scss'],
  standalone: false,
})
export class BrainstormingBlacklistEditComponent implements OnInit {
  @Input() room: Room;
  blacklist: BrainstormingWord[];
  showBlacklistWordList = false;
  newBlacklistWord: string;

  constructor(private _brainstormingService: BrainstormingService) {}

  ngOnInit(): void {
    const obj = this.room.brainstormingSession.wordsWithMeta;
    this.blacklist = Object.keys(obj)
      .map((key) => obj[key].word)
      .filter((w) => w.banned);
    this.sort();
  }

  addBlacklistWord() {
    this._brainstormingService
      .createWord(this.room.brainstormingSession.id, this.newBlacklistWord)
      .pipe(
        switchMap((word) =>
          this._brainstormingService.patchWord(word.id, { banned: true }),
        ),
      )
      .subscribe((word) => {
        if (this.blacklist.findIndex((w) => w.id === word.id) >= 0) {
          return;
        }
        this.blacklist.push(word);
        this.sort();
      });
    this.newBlacklistWord = '';
  }

  removeWordFromBlacklist(wordId: string) {
    const index = this.blacklist.findIndex((w) => w.id === wordId);
    if (index < 0) {
      return;
    }
    this._brainstormingService
      .patchWord(wordId, { banned: false })
      .subscribe(() => {
        this.blacklist.splice(index, 1);
      });
  }

  private sort() {
    this.blacklist.sort((a, b) =>
      a.word.localeCompare(b.word, undefined, { sensitivity: 'base' }),
    );
  }
}
