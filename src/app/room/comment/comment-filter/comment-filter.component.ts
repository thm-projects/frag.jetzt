import { Component, effect, input, output, signal } from '@angular/core';
import { ForumComment } from 'app/utils/data-accessor';
import { Filter } from '../comment/comment.component';
import { commentsMeta } from 'app/room/state/comments';

@Component({
  selector: 'app-comment-filter',
  templateUrl: './comment-filter.component.html',
  styleUrl: './comment-filter.component.scss',
  standalone: false,
})
export class CommentFilterComponent {
  comment = input.required<ForumComment>();
  filterSelect = output<Filter>();
  protected readonly userCount = signal(0);

  constructor() {
    effect(() => {
      const count = commentsMeta().userCount.get(this.comment()?.creatorId);
      this.userCount.set(count?.topLevel || 0);
    });
  }

  protected selectFilter(filter: Filter) {
    this.filterSelect.emit(filter);
  }
}
