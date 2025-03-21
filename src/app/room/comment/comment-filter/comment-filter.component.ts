import {
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { Filter } from '../comment/comment.component';
import { commentsMeta } from 'app/room/state/comments';
import { Comment } from 'app/models/comment';

@Component({
  selector: 'app-comment-filter',
  templateUrl: './comment-filter.component.html',
  styleUrl: './comment-filter.component.scss',
  standalone: false,
})
export class CommentFilterComponent {
  comment = input.required<Comment>();
  filterSelect = output<Filter>();
  protected keywords = computed(() => {
    const keywords = this.comment().keywordsFromQuestioner;
    if (keywords?.length) return keywords;
    return this.comment().keywordsFromSpacy;
  });
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
