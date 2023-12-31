export interface IconActionARIA {
  ariaId: string;
  ariaKey: string;
}

export interface IconActionState {
  active: boolean;
  disabled: boolean;
  class: string;
  icon: string;
  tooltipKey: string;
  ariaLabel: string;
}

export type MenuState = 'outside' | 'anywhere' | 'inside';

export type IconActionKey =
  | 'profanity_switcher'
  | 'fact_check'
  | 'correct'
  | 'wrong'
  | 'favorite'
  | 'bookmark'
  | 'change_tag'
  | 'edit'
  | 'share'
  | 'delete';

export const IconActionArias: { [key in IconActionKey]: IconActionARIA[] } = {
  profanity_switcher: [
    {
      ariaId: 'comment_action_profanity_on',
      ariaKey: 'comment-page.a11y.comment_action.profanity_on',
    },
    {
      ariaId: 'comment_action_profanity_off',
      ariaKey: 'comment-page.a11y.comment_action.profanity_off',
    },
  ],
  fact_check: [
    {
      ariaId: 'comment_action_approved',
      ariaKey: 'comment-page.a11y.comment_action.approved',
    },
    {
      ariaId: 'comment_action_not_approved',
      ariaKey: 'comment-page.a11y.comment_action.not_approved',
    },
    {
      ariaId: 'comment_action_approved_info',
      ariaKey: 'comment-page.a11y.comment_action.approved_info',
    },
    {
      ariaId: 'comment_action_not_approved_info',
      ariaKey: 'comment-page.a11y.comment_action.not_approved_info',
    },
  ],
  correct: [
    {
      ariaId: 'comment_action_correct',
      ariaKey: 'comment-page.a11y.comment_action.correct',
    },
    {
      ariaId: 'comment_action_not_correct',
      ariaKey: 'comment-page.a11y.comment_action.not_correct',
    },
    {
      ariaId: 'comment_action_correct_info',
      ariaKey: 'comment-page.a11y.comment_action.correct_info',
    },
    {
      ariaId: 'comment_action_not_correct_info',
      ariaKey: 'comment-page.a11y.comment_action.not_correct_info',
    },
  ],
  wrong: [
    {
      ariaId: 'comment_action_wrong',
      ariaKey: 'comment-page.a11y.comment_action.wrong',
    },
    {
      ariaId: 'comment_action_not_wrong',
      ariaKey: 'comment-page.a11y.comment_action.not_wrong',
    },
    {
      ariaId: 'comment_action_wrong_info',
      ariaKey: 'comment-page.a11y.comment_action.wrong_info',
    },
    {
      ariaId: 'comment_action_not_wrong_info',
      ariaKey: 'comment-page.a11y.comment_action.not_wrong_info',
    },
  ],
  favorite: [
    {
      ariaId: 'comment_action_favorite',
      ariaKey: 'comment-page.a11y.comment_action.favorite',
    },
    {
      ariaId: 'comment_action_not_favorite',
      ariaKey: 'comment-page.a11y.comment_action.not_favorite',
    },
    {
      ariaId: 'comment_action_favorite_info',
      ariaKey: 'comment-page.a11y.comment_action.favorite_info',
    },
    {
      ariaId: 'comment_action_not_favorite_info',
      ariaKey: 'comment-page.a11y.comment_action.not_favorite_info',
    },
  ],
  bookmark: [
    {
      ariaId: 'comment_action_bookmark',
      ariaKey: 'comment-page.a11y.comment_action.bookmark',
    },
    {
      ariaId: 'comment_action_not_bookmark',
      ariaKey: 'comment-page.a11y.comment_action.not_bookmark',
    },
  ],
  edit: [
    {
      ariaId: 'comment_action_edit',
      ariaKey: 'comment-page.a11y.comment_action.edit',
    },
  ],
  change_tag: [
    {
      ariaId: 'comment_action_change_tag',
      ariaKey: 'comment-page.a11y.comment_action.change_tag',
    },
  ],
  share: [
    {
      ariaId: 'comment_action_share',
      ariaKey: 'comment-page.a11y.comment_action.share',
    },
  ],
  delete: [
    {
      ariaId: 'comment_action_delete',
      ariaKey: 'comment-page.a11y.comment_action.delete',
    },
  ],
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const stateToNum = (state: MenuState): number => {
  if (state === 'outside') return 0;
  if (state === 'anywhere') return 1;
  if (state === 'inside') return 2;
  throw new Error('Invalid state');
};
