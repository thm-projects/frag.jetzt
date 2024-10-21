import { Component, input, output, signal } from '@angular/core';
import { ForumComment } from 'app/utils/data-accessor';
import { Filter } from '../comment/comment.component';
import { user } from 'app/user/state/user';

@Component({
  selector: 'app-comment-filter',
  templateUrl: './comment-filter.component.html',
  styleUrl: './comment-filter.component.scss',
})
export class CommentFilterComponent {
  comment = input.required<ForumComment>();
  filterSelect = output<Filter>();
  protected readonly userCount = signal(0); // TODO: 123
  protected readonly user = user;

  protected selectFilter(filter: Filter) {
    this.filterSelect.emit(filter);
  }
}
