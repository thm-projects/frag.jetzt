import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  WritableSignal,
} from '@angular/core';
import { ValueOption } from '../comment/comment.component';
import { ForumComment } from 'app/utils/data-accessor';
import { CorrectWrong } from 'app/models/correct-wrong.enum';
import { user } from 'app/user/state/user';
import { room } from 'app/room/state/room';
import { Comment } from 'app/models/comment';
import { CommentService } from 'app/services/http/comment.service';
import { windowWatcher } from 'modules/navigation/utils/window-watcher';
import { M3WindowSizeClass } from 'modules/m3/components/navigation/m3-navigation-types';
import { RoomStateService } from 'app/services/state/room-state.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { BookmarkService } from 'app/services/http/bookmark.service';
import { map, Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { EditCommentTagComponent } from 'app/components/creator/_dialogs/edit-comment-tag/edit-comment-tag.component';
import { EditQuestionComponent } from 'app/components/shared/_dialogs/edit-question/edit-question.component';
import { SessionService } from 'app/services/util/session.service';
import { UserRole } from 'app/models/user-roles.enum';
import { copyText } from 'app/room/util/clipboard';
import { DeleteCommentComponent } from 'app/components/creator/_dialogs/delete-comment/delete-comment.component';
import { userBookmarks } from 'app/room/state/comments';

interface Common {
  id: string;
  icon: string;
  label: string;
  description: string;
}

interface CommentAction extends Common {
  type: 'action';
  outsidePriority?: number;
  active?: boolean;
  disabled?: boolean;
  action: () => unknown;
}

interface CommentInfo extends Common {
  type: 'info';
}

type CommentElement = CommentInfo | CommentAction;

@Component({
  selector: 'app-comment-header-action',
  templateUrl: './comment-header-action.component.html',
  styleUrl: './comment-header-action.component.scss',
})
export class CommentHeaderActionComponent {
  comment = input.required<ForumComment>();
  protected readonly elements = computed(() => this.buildActions());
  protected readonly seperatedElements = computed(() => {
    const window = windowWatcher.windowState();
    let max = window === M3WindowSizeClass.Compact ? 1 : Number.MAX_VALUE;
    if (window === M3WindowSizeClass.Medium) {
      max = 3;
    }
    const outside = this.buildOutside(max);
    const inside = this.elements().filter((e) => !outside.includes(e));
    return [outside, inside] as const;
  });
  protected readonly acknowledged = signal<ValueOption<boolean>>({
    value: true,
    state: 'pending',
  });
  protected readonly correct = signal<ValueOption<0 | 1 | -1>>({
    value: 0,
    state: 'pending',
  });
  protected readonly bonus = signal<ValueOption<boolean>>({
    value: false,
    state: 'pending',
  });
  protected readonly bookmark = signal<ValueOption<boolean>>({
    value: false,
    state: 'pending',
  });
  private commentService = inject(CommentService);
  private assignedRole = toSignal(inject(RoomStateService).assignedRole$, {
    initialValue: 'Participant',
  });
  private bookmarkService = inject(BookmarkService);
  private dialog = inject(MatDialog);
  private sessionService = inject(SessionService);

  constructor() {
    effect(
      () => {
        const c = this.comment();
        this.acknowledged.set({ value: c.ack, state: 'valid' });
        if (c.correct === CorrectWrong.NULL) {
          this.correct.set({ value: 0, state: 'valid' });
        } else {
          this.correct.set({
            value: c.correct === CorrectWrong.CORRECT ? 1 : -1,
            state: 'valid',
          });
        }
        this.bonus.set({ value: c.favorite, state: 'valid' });
        const isParticipant = this.assignedRole() === 'Participant';
        if (isParticipant) return;
        this.bookmark.set({ value: c.bookmark, state: 'valid' });
      },
      { allowSignalWrites: true },
    );
    effect(
      () => {
        const c = this.comment();
        const isParticipant = this.assignedRole() === 'Participant';
        if (!isParticipant) return;
        const bookmarks = userBookmarks();
        if (!bookmarks) {
          this.bookmark.set({
            value: false,
            state: 'pending',
          });
          return;
        }
        this.bookmark.set({
          value: Boolean(bookmarks.get(c.id)),
          state: 'valid',
        });
      },
      { allowSignalWrites: true },
    );
  }

  private updateCommentTag() {
    const dialogRef = this.dialog.open(EditCommentTagComponent);
    dialogRef.componentInstance.selectedTag = this.comment().tag;
    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined) {
        this.commentService
          .updateCommentTag(this.comment(), result)
          .subscribe((comment) => {
            this.comment().tag = comment.tag;
          });
      }
    });
  }

  private editQuestion() {
    let role = UserRole.PARTICIPANT;
    const assigned = this.assignedRole();
    if (assigned === 'Creator') {
      role = UserRole.CREATOR;
    } else if (assigned === 'Moderator') {
      role = UserRole.EXECUTIVE_MODERATOR;
    }
    const ref = this.dialog.open(EditQuestionComponent, {
      width: '900px',
      maxWidth: '100%',
      maxHeight: 'calc( 100vh - 20px )',
      autoFocus: false,
    });
    ref.componentInstance.comment = this.comment();
    ref.componentInstance.tags = this.sessionService.currentRoom.tags;
    ref.componentInstance.userRole = role;
  }

  private copyLink() {
    const url = `${window.location.protocol}//${window.location.host}/participant/room/${room().shortId}/comment/${this.comment().id}/conversation`;
    copyText(url).subscribe();
  }

  private deleteComment() {
    const dialogRef = this.dialog.open(DeleteCommentComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'delete') {
        this.commentService.deleteComment(this.comment().id).subscribe();
      }
    });
  }

  private updateComment<T>(
    patch: Partial<Comment>,
    signal: WritableSignal<ValueOption<T>>,
    newState: T,
  ) {
    const state = signal();
    if (state.state === 'pending') return false;
    const beforeState = state.value;
    signal.set({ value: newState, state: 'pending' });
    const c = this.comment();
    this.commentService.patchComment(c, patch).subscribe({
      complete: () => {
        for (const key of Object.keys(patch)) {
          c[key] = patch[key];
        }
        signal.update((v) => ({ ...v, state: 'valid' }));
      },
      error: () =>
        signal.update(() => ({ value: beforeState, state: 'valid' })),
    });
    return true;
  }

  private updateBookmark() {
    const current = this.bookmark();
    if (current.state === 'pending') return;
    this.bookmark.set({
      value: !current.value,
      state: 'pending',
    });
    let observable: Observable<unknown>;
    if (!current.value) {
      observable = this.bookmarkService
        .create({
          roomId: room().id,
          accountId: user().id,
          commentId: this.comment().id,
        })
        .pipe(
          map((x) => {
            userBookmarks().set(this.comment().id, x);
            return null;
          }),
        );
    } else {
      const bookmark = userBookmarks().get(this.comment().id);
      observable = this.bookmarkService.delete(bookmark.id).pipe(
        map(() => {
          userBookmarks().delete(this.comment().id);
          return null;
        }),
      );
    }
    observable.subscribe({
      complete: () =>
        this.bookmark.update((v) => ({
          ...v,
          state: 'valid',
        })),
      error: () => this.bookmark.set(current),
    });
  }

  private buildOutside(max: number): CommentElement[] {
    const outside = [] as CommentElement[];
    let lowest = Number.MAX_VALUE;
    let lowIndex = -1;
    for (const elem of this.elements()) {
      if (elem.type === 'action' && !elem.outsidePriority) {
        continue;
      }
      const priority = elem.type === 'info' ? 0 : elem.outsidePriority;
      if (outside.length < max) {
        const index = outside.push(elem) - 1;
        if (priority < lowest) {
          lowest = priority;
          lowIndex = index;
        }
        continue;
      }
      if (priority <= lowest) {
        continue;
      }
      // find new minimal and move minimal sequence
      let newLow = Number.MAX_VALUE;
      let temp = outside.splice(lowIndex, 1)[0];
      for (let i = 0; i < outside.length; i++) {
        const e = outside[i];
        const priority = e.type === 'info' ? 0 : e.outsidePriority;
        if (priority < newLow) {
          newLow = priority;
          lowIndex = i;
        }
        if (priority === lowest) {
          outside[i] = temp;
          temp = e;
        }
      }
      lowest = newLow;
      outside.push(elem);
    }
    return outside;
  }

  private buildActions(): CommentElement[] {
    const acknowledged = this.acknowledged();
    const correct = this.correct();
    const bonus = this.bonus();
    const bookmark = this.bookmark();
    const text = i18n();
    const isOwner = this.comment().creatorId === user().id;
    const isModerator = this.assignedRole() !== 'Participant';
    const hasBonus = room()?.bonusArchiveActive;
    return [
      isModerator &&
        ({
          type: 'action',
          id: 'moderation',
          icon: 'gavel',
          label: acknowledged.value
            ? text.moderationLabel
            : text.revertModerationLabel,
          description: acknowledged.value
            ? text.moderation
            : text.revertModeration,
          disabled: acknowledged.state === 'pending',
          outsidePriority: 5,
          action: () => {
            this.updateComment(
              {
                ack: !acknowledged.value,
              },
              this.acknowledged,
              !acknowledged.value,
            );
          },
        } satisfies CommentElement),
      isModerator &&
        ({
          type: 'action',
          id: 'right',
          icon: 'check_circle',
          label: text.correctLabel,
          description: correct.value === 1 ? text.revertCorrect : text.correct,
          outsidePriority: 4,
          active: correct.value === 1,
          disabled: correct.state === 'pending',
          action: () => {
            const newCorrect =
              correct.value === 1 ? CorrectWrong.NULL : CorrectWrong.CORRECT;
            this.updateComment(
              {
                correct: newCorrect,
              },
              this.correct,
              correct.value === 1 ? 0 : 1,
            );
          },
        } satisfies CommentElement),
      !isModerator &&
        correct.value === 1 &&
        ({
          type: 'info',
          id: 'right_info',
          icon: 'check_circle',
          label: text.correctInfoLabel,
          description: text.correctInfo,
        } satisfies CommentElement),
      isModerator &&
        ({
          type: 'action',
          id: 'wrong',
          icon: 'cancel',
          label: text.wrongLabel,
          description: correct.value === -1 ? text.revertWrong : text.wrong,
          outsidePriority: 4,
          active: correct.value === -1,
          disabled: correct.state === 'pending',
          action: () => {
            const newCorrect =
              correct.value === -1 ? CorrectWrong.NULL : CorrectWrong.WRONG;
            this.updateComment(
              {
                correct: newCorrect,
              },
              this.correct,
              correct.value === -1 ? 0 : -1,
            );
          },
        } satisfies CommentElement),
      !isModerator &&
        correct.value === -1 &&
        ({
          type: 'info',
          id: 'wrong_info',
          icon: 'cancel',
          label: text.wrongInfoLabel,
          description: text.wrongInfo,
        } satisfies CommentElement),
      isModerator &&
        ({
          type: 'action',
          id: 'favorite',
          icon: 'star',
          label: hasBonus ? text.bonusLabel : text.favoriteLabel,
          description: bonus.value
            ? text.revertFavorite
            : hasBonus
              ? text.bonus
              : text.favorite,
          outsidePriority: 5,
          active: bonus.value,
          disabled: bonus.state === 'pending',
          action: () => {
            this.updateComment(
              {
                favorite: !bonus.value,
              },
              this.bonus,
              !bonus.value,
            );
          },
        } satisfies CommentElement),
      !isModerator &&
        bonus.value &&
        ({
          type: 'info',
          id: 'favorite_info',
          icon: 'star',
          label: hasBonus ? text.bonusInfoLabel : text.favoriteInfoLabel,
          description: hasBonus ? text.bonusInfo : text.favoriteInfo,
        } satisfies CommentElement),
      {
        type: 'action',
        id: 'bookmark',
        icon: 'bookmark',
        label: text.bookmarkLabel,
        description: bookmark.value ? text.revertBookmark : text.bookmark,
        outsidePriority: 5,
        active: bookmark.value,
        disabled: bookmark.state === 'pending',
        action: () => {
          if (this.assignedRole() !== 'Participant') {
            this.updateComment(
              {
                bookmark: !bookmark.value,
              },
              this.bookmark,
              !bookmark.value,
            );
            return;
          }
          this.updateBookmark();
        },
      } satisfies CommentElement,
      (isOwner || isModerator) &&
        ({
          type: 'action',
          id: 'edit',
          icon: 'edit',
          label: text.editLabel,
          description: text.edit,
          action: () => {
            this.editQuestion();
          },
        } satisfies CommentElement),
      (isOwner || isModerator) &&
        ({
          type: 'action',
          id: 'category',
          icon: 'sell',
          label: text.categoryLabel,
          description: text.category,
          action: () => {
            this.updateCommentTag();
          },
        } satisfies CommentElement),
      {
        type: 'action',
        id: 'share',
        icon: 'share',
        label: text.shareLabel,
        description: text.share,
        action: () => {
          this.copyLink();
        },
      } satisfies CommentElement,
      (isOwner || isModerator) &&
        ({
          type: 'action',
          id: 'delete',
          icon: 'delete',
          label: text.deleteLabel,
          description: text.delete,
          action: () => {
            this.deleteComment();
          },
        } satisfies CommentElement),
    ].filter(Boolean);
  }
}
