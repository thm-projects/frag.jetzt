import { Component, effect, input, output, signal } from '@angular/core';
import { ForumComment } from 'app/utils/data-accessor';
import { Filter } from '../comment/comment.component';
import { user } from 'app/user/state/user';
import { commentsMeta } from 'app/room/state/comments';

@Component({
  selector: 'app-comment-filter',
  templateUrl: './comment-filter.component.html',
  styleUrl: './comment-filter.component.scss',
})
export class CommentFilterComponent {
  comment = input.required<ForumComment>();
  filterSelect = output<Filter>();
  protected readonly userCount = signal(0);
  protected readonly user = user;

  constructor() {
    effect(
      () => {
        const count = commentsMeta().userCount.get(this.comment()?.creatorId);
        this.userCount.set(count?.topLevel || 0);
      },
      { allowSignalWrites: true },
    );
  }

  protected selectFilter(filter: Filter) {
    this.filterSelect.emit(filter);
  }
}
