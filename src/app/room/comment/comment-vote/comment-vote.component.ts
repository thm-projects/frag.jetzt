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
} from '@angular/core';
import { ValueOption } from '../comment/comment.component';
import { userVotes } from 'app/room/state/comments';
import { VoteService } from 'app/services/http/vote.service';
import { map, Observable } from 'rxjs';
import { user } from 'app/user/state/user';
import { Comment } from 'app/models/comment';

@Component({
  selector: 'app-comment-vote',
  templateUrl: './comment-vote.component.html',
  styleUrl: './comment-vote.component.scss',
  standalone: false,
})
export class CommentVoteComponent {
  comment = input.required<Comment>();
  protected readonly i18n = i18n;
  protected readonly vote = signal<ValueOption<0 | 1 | -1>>({
    value: 0,
    state: 'pending',
  });
  protected readonly canVote = computed(
    () => this.comment() && user() && this.comment().creatorId !== user().id,
  );
  private voteService = inject(VoteService);

  constructor() {
    effect(() => {
      const votes = userVotes.value();
      if (!votes) return;
      const value = (votes.get(this.comment().id)?.vote || 0) as 0 | 1 | -1;
      this.vote.set({ value, state: 'valid' });
    });
  }

  protected doVote(num: 1 | -1) {
    const current = this.vote();
    if (current.state === 'pending') return;
    const newValue = current.value === num ? 0 : num;
    this.vote.set({
      value: newValue,
      state: 'pending',
    });
    let observable: Observable<unknown>;
    if (newValue !== 0) {
      const obs =
        newValue === 1
          ? this.voteService.voteUp(this.comment(), user().id)
          : this.voteService.voteDown(this.comment(), user().id);
      observable = obs.pipe(
        map((v) => {
          userVotes.value().set(this.comment().id, v);
          return null;
        }),
      );
    } else {
      observable = this.voteService.resetVote(this.comment(), user().id).pipe(
        map(() => {
          userVotes.value().delete(this.comment().id);
          return null;
        }),
      );
    }
    observable.subscribe({
      complete: () =>
        this.vote.update((v) => ({
          ...v,
          state: 'valid',
        })),
      error: () => this.vote.set(current),
    });
  }
}
