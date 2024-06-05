import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ForumComment } from '../../../../utils/data-accessor';
import { Comment } from '../../../../models/comment';
import { CommentService } from '../../../../services/http/comment.service';
import { User } from '../../../../models/user';
import { CommentListSupport } from './comment-list-support';
import { SessionService } from '../../../../services/util/session.service';
import { Room } from '../../../../models/room';

@Injectable({
  providedIn: 'root',
})
export class QuestionWallService {
  public readonly focus: BehaviorSubject<ForumComment | undefined> =
    new BehaviorSubject(undefined);
  public readonly user: BehaviorSubject<User | undefined> = new BehaviorSubject(
    undefined,
  );
  private readonly _support: BehaviorSubject<CommentListSupport | undefined> =
    new BehaviorSubject(undefined);
  private readonly _commentsCountQuestions = new BehaviorSubject<number>(0);
  private readonly _commentsCountUsers = new BehaviorSubject<number>(0);
  private _room: Room | undefined;

  constructor(
    private readonly commentService: CommentService,
    private readonly sessionService: SessionService,
  ) {}

  like(comment: Comment) {
    this.commentService.voteUp(comment, this.user.value.id).subscribe();
  }

  dislike(comment: Comment) {
    this.commentService.voteDown(comment, this.user.value.id).subscribe();
  }

  get commentsCountQuestions(): number {
    return this._commentsCountQuestions.value;
  }

  set commentsCountQuestions(value: number) {
    this._commentsCountQuestions.next(value);
  }

  get commentsCountUsers(): number {
    return this._commentsCountUsers.value;
  }

  set commentsCountUsers(value: number) {
    this._commentsCountUsers.next(value);
  }

  get support() {
    if (!this._support.value) throw new Error();
    return this._support.value!;
  }

  get room() {
    if (!this._room) throw new Error();
    return this._room;
  }

  set support(value: CommentListSupport) {
    this._support.next(value);
  }

  getAnswers() {}

  init(support: CommentListSupport) {
    this.support = support;
    this.sessionService.getRoomOnce().subscribe((room) => (this._room = room));
  }
}
