import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import { Component, computed, effect, input, signal } from '@angular/core';
import { ValueOption } from '../comment/comment.component';
import { ForumComment } from 'app/utils/data-accessor';
import { CorrectWrong } from 'app/models/correct-wrong.enum';
import { user } from 'app/user/state/user';
import { KeycloakRoles } from 'app/models/user';
import { room } from 'app/room/state/room';

interface CommentAction {
  type: 'action';
  id: string;
  icon: string;
  label: string;
  description: string;
  outside: boolean;
  active?: boolean;
  disabled?: boolean;
  action: () => unknown;
}

interface CommentInfo {
  type: 'info';
  id: string;
  icon: string;
  label: string;
}

@Component({
  selector: 'app-comment-header-action',
  templateUrl: './comment-header-action.component.html',
  styleUrl: './comment-header-action.component.scss',
})
export class CommentHeaderActionComponent {
  comment = input.required<ForumComment>();
  protected readonly actions = computed(() => this.buildActions());
  protected readonly plainActions = computed(() =>
    this.actions().filter((a) => a.type === 'info' || a.outside),
  );
  protected readonly moreActions = computed(
    () =>
      this.actions().filter(
        (a) => a.type !== 'info' && !a.outside,
      ) as CommentAction[],
  );
  protected readonly approved = signal<ValueOption<boolean>>({
    value: false,
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

  constructor() {
    effect(
      () => {
        const c = this.comment();
        this.approved.set({ value: c.approved, state: 'valid' });
        if (c.correct === CorrectWrong.NULL) {
          this.correct.set({ value: 0, state: 'valid' });
        } else {
          this.correct.set({
            value: c.correct === CorrectWrong.CORRECT ? 1 : -1,
            state: 'valid',
          });
        }
        this.bonus.set({ value: c.favorite, state: 'valid' });
        this.bookmark.set({ value: c.bookmark, state: 'valid' });
      },
      { allowSignalWrites: true },
    );
  }

  private buildActions(): (CommentAction | CommentInfo)[] {
    const approved = this.approved();
    const correct = this.correct();
    const bonus = this.bonus();
    const bookmark = this.bookmark();
    const text = i18n();
    const isOwner = this.comment().creatorId === user().id;
    const isModerator = user().hasRole(KeycloakRoles.AdminAllRoomsOwner);
    const hasBonus = room().bonusArchiveActive;
    return [
      isModerator && {
        type: 'action',
        id: 'fact_check',
        icon: approved.value ? 'fact_check' : 'rule',
        label: text.factCheckLabel,
        description: approved.value ? text.revertFactCheck : text.factCheck,
        outside: true,
        active: approved.value,
        disabled: approved.state === 'pending',
        action: () => {
          if (approved.state === 'pending') return;
          this.approved.set({ value: !approved.value, state: 'pending' });
          setTimeout(
            () => this.approved.update((v) => ({ ...v, state: 'valid' })),
            Math.random() * 3000,
          );
        },
      },
      !isModerator &&
        approved.value && {
          type: 'info',
          id: 'fact_check_info',
          icon: 'fact_check',
          label: text.factCheckInfo,
        },
      isModerator && {
        type: 'action',
        id: 'right',
        icon: 'check_circle',
        label: text.correctLabel,
        description: correct.value === 1 ? text.revertCorrect : text.correct,
        outside: true,
        active: correct.value === 1,
        disabled: correct.state === 'pending',
        action: () => {
          if (correct.state === 'pending') return;
          this.correct.set({
            value: correct.value === 1 ? 0 : 1,
            state: 'pending',
          });
          setTimeout(
            () => this.correct.update((v) => ({ ...v, state: 'valid' })),
            Math.random() * 3000,
          );
        },
      },
      !isModerator &&
        correct.value === 1 && {
          type: 'info',
          id: 'right_info',
          icon: 'check_circle',
          label: text.correctInfo,
        },
      isModerator && {
        type: 'action',
        id: 'wrong',
        icon: 'cancel',
        label: text.wrongLabel,
        description: correct.value === -1 ? text.revertWrong : text.wrong,
        outside: true,
        active: correct.value === -1,
        disabled: correct.state === 'pending',
        action: () => {
          if (correct.state === 'pending') return;
          this.correct.set({
            value: correct.value === -1 ? 0 : -1,
            state: 'pending',
          });
          setTimeout(
            () => this.correct.update((v) => ({ ...v, state: 'valid' })),
            Math.random() * 3000,
          );
        },
      },
      !isModerator &&
        correct.value === -1 && {
          type: 'info',
          id: 'wrong_info',
          icon: 'cancel',
          label: text.wrongInfo,
        },
      isModerator && {
        type: 'action',
        id: 'favorite',
        icon: 'star',
        label: hasBonus ? text.bonusLabel : text.favoriteLabel,
        description: bonus.value
          ? text.revertFavorite
          : hasBonus
            ? text.bonus
            : text.favorite,
        outside: true,
        active: bonus.value,
        disabled: bonus.state === 'pending',
        action: () => {
          if (bonus.state === 'pending') return;
          this.bonus.set({ value: !bonus.value, state: 'pending' });
          setTimeout(
            () => this.bonus.update((v) => ({ ...v, state: 'valid' })),
            Math.random() * 3000,
          );
        },
      },
      !isModerator &&
        bonus.value && {
          type: 'info',
          id: 'favorite_info',
          icon: 'star',
          label: hasBonus ? text.bonusInfo : text.favoriteInfo,
        },
      {
        type: 'action',
        id: 'bookmark',
        icon: 'bookmark',
        label: text.bookmarkLabel,
        description: bookmark.value ? text.revertBookmark : text.bookmark,
        outside: true,
        active: bookmark.value,
        disabled: bookmark.state === 'pending',
        action: () => {
          if (bookmark.state === 'pending') return;
          this.bookmark.set({ value: !bookmark.value, state: 'pending' });
          setTimeout(
            () => this.bookmark.update((v) => ({ ...v, state: 'valid' })),
            Math.random() * 3000,
          );
        },
      },
      (isOwner || isModerator) && {
        type: 'action',
        id: 'edit',
        icon: 'edit',
        label: text.editLabel,
        description: text.edit,
        outside: false,
        action: () => {
          console.log('Edit');
        },
      },
      (isOwner || isModerator) && {
        type: 'action',
        id: 'category',
        icon: 'sell',
        label: text.categoryLabel,
        description: text.category,
        outside: false,
        action: () => {
          console.log('Category');
        },
      },
      {
        type: 'action',
        id: 'share',
        icon: 'share',
        label: text.shareLabel,
        description: text.share,
        outside: false,
        action: () => {
          console.log('Share');
        },
      },
      (isOwner || isModerator) && {
        type: 'action',
        id: 'delete',
        icon: 'delete',
        label: text.deleteLabel,
        description: text.delete,
        outside: false,
        action: () => {
          console.log('Delete');
        },
      },
    ].filter(Boolean) as (CommentAction | CommentInfo)[];
  }
}
