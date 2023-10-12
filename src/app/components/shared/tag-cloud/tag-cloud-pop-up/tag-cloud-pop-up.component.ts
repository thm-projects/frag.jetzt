import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  TagCloudDataService,
  TagCloudDataTagEntry,
} from '../../../../services/util/tag-cloud-data.service';
import {
  LanguagetoolResult,
  LanguagetoolService,
} from '../../../../services/http/languagetool.service';
import { FormControl } from '@angular/forms';
import { TSMap } from 'typescript-map';
import { CommentService } from '../../../../services/http/comment.service';
import { NotificationService } from '../../../../services/util/notification.service';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { UserRole } from '../../../../models/user-roles.enum';
import { SpacyKeyword } from '../../../../services/http/spacy.service';
import { Router } from '@angular/router';
import { Room } from '../../../../models/room';
import { SessionService } from '../../../../services/util/session.service';
import { BrainstormingService } from '../../../../services/http/brainstorming.service';
import { ReplaySubject, takeUntil } from 'rxjs';
import { BrainstormingDataService } from 'app/services/util/brainstorming-data.service';
import { BrainstormingTopic } from 'app/services/util/brainstorming-data-builder';
import { BrainstormingCategory } from 'app/models/brainstorming-category';
import {
  ROOM_ROLE_MAPPER,
  RoomStateService,
} from 'app/services/state/room-state.service';

const CLOSE_TIME = 100;

@Component({
  selector: 'app-tag-cloud-pop-up',
  templateUrl: './tag-cloud-pop-up.component.html',
  styleUrls: ['./tag-cloud-pop-up.component.scss'],
})
export class TagCloudPopUpComponent
  implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('popupContainer') popupContainer: ElementRef;
  @ViewChild(MatAutocompleteTrigger) trigger: MatAutocompleteTrigger;
  @Input() room: Room;
  @Input() requester: (index: number) => void;
  replacementInput = new FormControl();
  userRole: UserRole;
  // Both
  tag: string;
  previousTag: string;
  elem: HTMLElement;
  timePeriodText: string;
  categories: string[];
  // Normal
  tagData: TagCloudDataTagEntry;
  spellingData: string[] = [];
  isBlacklistActive = true;
  // Brainstorming
  isBrainstorming = false;
  isBrainstormingActive = false;
  isRatingAllowed = false;
  brainstormingData: BrainstormingTopic;
  possibleCategories: BrainstormingCategory[];
  selectedCategory: string;
  private _popupHoverTimer;
  private _popupCloseTimer;
  private _hasLeft = true;
  private _isSending = false;
  private _destroyer = new ReplaySubject(1);

  constructor(
    private translateService: TranslateService,
    private tagCloudDataService: TagCloudDataService,
    private languagetoolService: LanguagetoolService,
    private commentService: CommentService,
    private sessionService: SessionService,
    private router: Router,
    private notificationService: NotificationService,
    private brainstormingService: BrainstormingService,
    private brainstormingDataService: BrainstormingDataService,
    private roomState: RoomStateService,
  ) {}

  ngOnInit(): void {
    this.roomState.assignedRole$
      .pipe(takeUntil(this._destroyer))
      .subscribe((role) => (this.userRole = ROOM_ROLE_MAPPER[role] ?? null));
    this.timePeriodText = '...';
  }

  ngAfterViewInit() {
    const html = this.popupContainer.nativeElement as HTMLDivElement;
    html.addEventListener('mouseenter', () => {
      clearTimeout(this._popupCloseTimer);
      this._hasLeft = false;
    });
    html.addEventListener('mouseleave', () => {
      this._hasLeft = true;
      this.close();
    });
  }

  ngOnDestroy(): void {
    this._destroyer.next(true);
    this._destroyer.complete();
  }

  onFocusOut() {
    this.close();
  }

  leave(): void {
    if (this.elem && this.previousTag) {
      this.elem.innerText = this.previousTag;
    }
    clearTimeout(this._popupHoverTimer);
    this.close();
  }

  getBrainstormingUpvotes(): number {
    const wordId = this.brainstormingData.words.values().next().value;
    return this.room.brainstormingSession.wordsWithMeta[wordId].word.upvotes;
  }

  getBrainstormingDownvotes(): number {
    const wordId = this.brainstormingData.words.values().next().value;
    return this.room.brainstormingSession.wordsWithMeta[wordId].word.downvotes;
  }

  getBrainstormingVotes(): number {
    const wordId = this.brainstormingData.words.values().next().value;
    const word = this.room.brainstormingSession.wordsWithMeta[wordId].word;
    return word.upvotes - word.downvotes;
  }

  getOwnVote(): number {
    const wordId = this.brainstormingData.words.values().next().value;
    const vote =
      this.room.brainstormingSession.wordsWithMeta?.[wordId]?.ownHasUpvoted;
    if (vote === true) {
      return 1;
    } else if (vote === false) {
      return -1;
    } else {
      //undefined or null
      return 0;
    }
  }

  openTag() {
    this.requester?.(Number(this.elem.dataset.index));
  }

  enterBrainstorming(
    elem: HTMLElement,
    tag: string,
    isBrainstormingActive: boolean,
    isRatingAllowed: boolean,
    hoverDelayInMs: number,
    brainstormingData: BrainstormingTopic,
    possibleCategories: BrainstormingCategory[],
  ) {
    if (!elem) {
      return;
    }
    this.spellingData = [];
    clearTimeout(this._popupCloseTimer);
    clearTimeout(this._popupHoverTimer);
    this._hasLeft = true;
    this._popupHoverTimer = setTimeout(() => {
      this.possibleCategories = possibleCategories;
      this.isBlacklistActive = true;
      this.isBrainstorming = true;
      this.isBrainstormingActive = isBrainstormingActive;
      this.isRatingAllowed = isRatingAllowed;
      this.tag = tag;
      this.previousTag = elem.innerText;
      elem.innerText = this.tag;
      this.elem = elem;
      this.brainstormingData = brainstormingData;
      const keys = [...brainstormingData.categories.keys()];
      this.selectedCategory = keys.length > 0 ? keys[0] : null;
      this.categories = keys
        .map((key) => possibleCategories.find((e) => e.id === key)?.name)
        .filter((e) => e);
      this.timePeriodText = '';
      this.position(elem);
    }, hoverDelayInMs);
  }

  enter(
    elem: HTMLElement,
    tag: string,
    tagData: TagCloudDataTagEntry,
    hoverDelayInMs: number,
    isBlacklistActive: boolean,
  ): void {
    if (!elem) {
      return;
    }
    this.spellingData = [];
    if (this.userRole > UserRole.PARTICIPANT) {
      this.languagetoolService
        .checkSpellings(tag, 'auto')
        .subscribe((correction) => {
          const langKey = correction.language.code.split('-')[0].toUpperCase();
          if (['DE', 'FR', 'EN'].indexOf(langKey) < 0) {
            return;
          }
          this.fillSpellingData(correction);
        });
    }
    clearTimeout(this._popupCloseTimer);
    clearTimeout(this._popupHoverTimer);
    this._hasLeft = true;
    this._popupHoverTimer = setTimeout(() => {
      this.isBrainstorming = false;
      this.tag = tag;
      this.previousTag = null; // dont allow modification of tag key
      this.elem = elem;
      this.tagData = tagData;
      this.categories = Array.from(tagData.categories.keys());
      this.calculateDateText(() => {
        this.position(elem);
        this.isBlacklistActive = isBlacklistActive;
      });
    }, hoverDelayInMs);
  }

  addBlacklistWord(): void {
    if (this.isBrainstorming) {
      this.brainstormingData.words.forEach((wordId) => {
        this.brainstormingDataService.blockWord(wordId);
      });
    } else {
      this.tagCloudDataService.blockWord(this.tag, this.room);
    }
    this.close(false);
  }

  close(addDelay = true): void {
    const html = this.popupContainer.nativeElement as HTMLDivElement;
    clearTimeout(this._popupCloseTimer);
    if (addDelay) {
      if (
        !this._hasLeft ||
        (html.contains(document.activeElement) &&
          html !== document.activeElement)
      ) {
        return;
      }
      this._popupCloseTimer = setTimeout(() => {
        if (
          html.contains(document.activeElement) &&
          html !== document.activeElement
        ) {
          return;
        }
        html.classList.remove('up', 'down', 'right', 'left');
      }, CLOSE_TIME);
    } else {
      html.classList.remove('up', 'down', 'right', 'left');
    }
  }

  isNewTagReady(): boolean {
    if (!this.replacementInput.value) {
      return false;
    }
    const tag = this.replacementInput.value.trim();
    if (this.isBrainstorming) {
      return !(tag.length < 1 || tag === this.brainstormingData.preview);
    }
    return !(tag.length < 1 || tag === this.tag);
  }

  updateCategory(value: string): void {
    this.brainstormingData.words.forEach((wordId) => {
      this.brainstormingService
        .patchWord(wordId, {
          categoryId: value || null,
        })
        .subscribe({
          complete: () => this.close(false),
        });
    });
  }

  updateTag(): void {
    if (!this.isNewTagReady()) {
      return;
    }
    const tagReplacementInput = this.replacementInput.value.trim();
    if (this.isBrainstorming) {
      const changes = {
        correctedWord: tagReplacementInput,
      };
      this.brainstormingData.words.forEach((wordId) => {
        this.brainstormingService.patchWord(wordId, changes).subscribe();
      });
      this.close(false);
      this.replacementInput.reset();
      return;
    }
    const renameKeyword = (elem: SpacyKeyword) => {
      if (elem.text === this.tag) {
        elem.text = tagReplacementInput;
      }
    };
    const tagReplacementInputLower = tagReplacementInput.toLowerCase();
    this.tagData.comments.forEach((comment) => {
      const changes = new TSMap<string, any>();
      if (
        comment.keywordsFromQuestioner.findIndex(
          (e) => e.text.toLowerCase() === tagReplacementInputLower,
        ) >= 0
      ) {
        comment.keywordsFromQuestioner = comment.keywordsFromQuestioner.filter(
          (e) => e.text !== this.tag,
        );
      } else {
        comment.keywordsFromQuestioner.forEach(renameKeyword);
      }
      changes.set(
        'keywordsFromQuestioner',
        JSON.stringify(comment.keywordsFromQuestioner),
      );
      if (
        comment.keywordsFromSpacy.findIndex(
          (e) => e.text.toLowerCase() === tagReplacementInputLower,
        ) >= 0
      ) {
        comment.keywordsFromSpacy = comment.keywordsFromSpacy.filter(
          (e) => e.text !== this.tag,
        );
      } else {
        comment.keywordsFromSpacy.forEach(renameKeyword);
      }
      changes.set(
        'keywordsFromSpacy',
        JSON.stringify(comment.keywordsFromSpacy),
      );

      this.commentService.patchComment(comment, changes).subscribe({
        next: () => {
          this.translateService
            .get('topic-cloud-dialog.keyword-edit')
            .subscribe((msg) => {
              this.notificationService.show(msg);
            });
        },
        error: () => {
          this.translateService
            .get('topic-cloud-dialog.changes-gone-wrong')
            .subscribe((msg) => {
              this.notificationService.show(msg);
            });
        },
      });
    });
    this.close(false);
    this.replacementInput.reset();
    this.trigger.closePanel();
  }

  checkEnter(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      this.updateTag();
    }
  }

  getTooltip(str: string): string {
    return this.isBrainstorming ? str + '-brainstorming' : str;
  }

  onBrainstormVote(upvote: boolean) {
    if (this._isSending) {
      return;
    }
    this._isSending = true;
    const currentVote = upvote ? 1 : -1;
    const lastVote = this.getOwnVote();
    if (currentVote === lastVote) {
      this.setOwnVote(0);
      this.brainstormingData.words.forEach((wordId) => {
        this.brainstormingService.deleteVote(wordId).subscribe({
          next: (_) => (this._isSending = false),
          error: (_) => {
            this.setOwnVote(lastVote);
            this._isSending = false;
          },
        });
      });
      return;
    }
    this.setOwnVote(currentVote);
    this.brainstormingData.words.forEach((wordId) => {
      this.brainstormingService.createVote(wordId, upvote).subscribe({
        next: (_) => (this._isSending = false),
        error: (_) => {
          this.setOwnVote(lastVote);
          this._isSending = false;
        },
      });
    });
  }

  private fillSpellingData(correction: LanguagetoolResult): void {
    for (const match of correction.matches) {
      if (match.replacements != null && match.replacements.length > 0) {
        for (const replacement of match.replacements) {
          this.spellingData.push(replacement.value);
        }
      }
    }
  }

  private setOwnVote(vote: number) {
    let upvote = true;
    if (vote === 0) {
      upvote = null;
    } else if (vote === -1) {
      upvote = false;
    }
    this.brainstormingData.words.forEach((wordId) => {
      this.room.brainstormingSession.wordsWithMeta[wordId].ownHasUpvoted =
        upvote;
    });
  }

  private position(elem: HTMLElement) {
    const html = this.popupContainer.nativeElement as HTMLDivElement;
    const popup = html.getBoundingClientRect();
    const tag = elem.getBoundingClientRect();
    const boundingBox = elem.parentElement.getBoundingClientRect();
    // calculate the free space to the left, right, top and bottom from tag
    const spaceLeft = tag.x + tag.width / 2;
    const spaceRight = boundingBox.right - tag.right + tag.width / 2;
    const spaceTop = tag.y - boundingBox.y;
    const spaceBottom = boundingBox.bottom - tag.bottom;
    // set flags if tag is near bounding box
    const isLeft = spaceLeft <= popup.width / 2.0;
    const isRight = spaceRight <= popup.width / 2.0;
    const isTop = spaceTop <= popup.height;
    const isBottom = spaceBottom <= popup.height;

    // try to make a decision where to place the popup outgoing from tag with checks if we are at a border of the viewport
    enum PopupPosition {
      Top,
      Bottom,
      Left,
      Right,
    }

    let dockingPosition;
    if (isLeft && isTop && !isBottom && !isRight) {
      dockingPosition = PopupPosition.Right;
    } else if (isTop && !isLeft && !isRight && !isBottom) {
      dockingPosition = PopupPosition.Bottom;
    } else if (isRight && isTop && !isLeft && !isBottom) {
      dockingPosition = PopupPosition.Left;
    } else if (isLeft && !isTop && !isRight && !isBottom) {
      dockingPosition = PopupPosition.Right;
    } else if (!isLeft && !isTop && !isRight && !isBottom) {
      // default docking when all sides offer enough space
      dockingPosition = PopupPosition.Top;
    } else if (isRight && !isTop && !isLeft && !isBottom) {
      dockingPosition = PopupPosition.Left;
    } else if (isLeft && isBottom && !isTop && !isRight) {
      dockingPosition = PopupPosition.Right;
    } else if (!isLeft && isBottom && !isTop && !isRight) {
      dockingPosition = PopupPosition.Top;
    } else if (!isLeft && isBottom && isTop && !isRight) {
      dockingPosition = PopupPosition.Left;
    } else {
      /*
       * Find solution for small screens when all sides produce unpleasant results
       */
      dockingPosition = PopupPosition.Top;
    }
    html.classList.remove('left', 'right', 'up', 'down');
    if (dockingPosition === PopupPosition.Bottom) {
      html.style.top = tag.bottom + 'px';
      html.style.left = tag.x + tag.width / 2 + 'px';
      html.classList.add('up');
    } else if (dockingPosition === PopupPosition.Top) {
      html.style.top = tag.y + 'px';
      html.style.left = tag.x + tag.width / 2 + 'px';
      html.classList.add('down');
    } else if (dockingPosition === PopupPosition.Left) {
      html.style.top = tag.top + tag.height / 2 + 'px';
      html.style.left = tag.x + 'px';
      html.classList.add('right');
    } else if (dockingPosition === PopupPosition.Right) {
      html.style.top = tag.top + tag.height / 2 + 'px';
      html.style.left = tag.right + 'px';
      html.classList.add('left');
    }
    html.focus();
  }

  private calculateDateText(afterInit: () => void): void {
    const subscriber = (e: string) => {
      this.timePeriodText = e;
      if (afterInit) {
        setTimeout(afterInit);
      }
    };
    // @ts-ignore
    const diffMs = Date.now() - Date.parse(this.tagData.firstTimeStamp);
    const seconds = Math.floor(diffMs / 1_000);
    if (seconds < 60) {
      // few seconds
      this.translateService
        .get('tag-cloud-popup.few-seconds')
        .subscribe(subscriber);
      return;
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 5) {
      // few minutes
      this.translateService
        .get('tag-cloud-popup.few-minutes')
        .subscribe(subscriber);
      return;
    } else if (minutes < 60) {
      // x minutes
      this.translateService
        .get('tag-cloud-popup.some-minutes', {
          minutes,
        })
        .subscribe(subscriber);
      return;
    }
    const hours = Math.floor(minutes / 60);
    if (hours === 1) {
      // 1 hour
      this.translateService
        .get('tag-cloud-popup.one-hour')
        .subscribe(subscriber);
      return;
    } else if (hours < 24) {
      // x hours
      this.translateService
        .get('tag-cloud-popup.some-hours', {
          hours,
        })
        .subscribe(subscriber);
      return;
    }
    const days = Math.floor(hours / 24);
    if (days === 1) {
      // 1 day
      this.translateService
        .get('tag-cloud-popup.one-day')
        .subscribe(subscriber);
      return;
    } else if (days < 7) {
      // x days
      this.translateService
        .get('tag-cloud-popup.some-days', {
          days,
        })
        .subscribe(subscriber);
      return;
    }
    const weeks = Math.floor(days / 7);
    if (weeks === 1) {
      // 1 week
      this.translateService
        .get('tag-cloud-popup.one-week')
        .subscribe(subscriber);
      return;
    } else if (weeks < 12) {
      // x weeks
      this.translateService
        .get('tag-cloud-popup.some-weeks', {
          weeks,
        })
        .subscribe(subscriber);
      return;
    }
    const months = Math.floor(weeks / 4);
    // x months
    this.translateService
      .get('tag-cloud-popup.some-months', {
        months,
      })
      .subscribe(subscriber);
  }
}
