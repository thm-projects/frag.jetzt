import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ForumComment } from '../../../../utils/data-accessor';
import { Comment } from '../../../../models/comment';
import { CommentService } from '../../../../services/http/comment.service';
import { User } from '../../../../models/user';

@Injectable({
  providedIn: 'root',
})
export class QuestionWallService {
  public readonly focus: BehaviorSubject<ForumComment | undefined> =
    new BehaviorSubject(undefined);
  public readonly user: BehaviorSubject<User | undefined> = new BehaviorSubject(
    undefined,
  );

  constructor(private readonly commentService: CommentService) {}

  like(comment: Comment) {
    this.commentService.voteUp(comment, this.user.value.id).subscribe();
  }

  dislike(comment: Comment) {
    this.commentService.voteDown(comment, this.user.value.id).subscribe();
  }
}
