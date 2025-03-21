import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CommentService } from '../http/comment.service';
import { TSMap } from 'typescript-map';
import { Comment, Language } from '../../models/comment';
import { generateConsequentlyUUID } from '../../utils/test-utils';
import { CorrectWrong } from '../../models/correct-wrong.enum';
import { map } from 'rxjs/operators';

@Injectable()
export class CommentServiceMock extends CommentService {
  constructor() {
    super(null);
  }

  override patchComment(
    comment: Comment,
    changes: TSMap<string, unknown>,
  ): Observable<Comment> {
    changes.forEach((value, key) => {
      comment[key] = value;
    });
    return of(comment);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override getComments(roomId: string): Observable<Comment[]> {
    return of([
      new Comment({
        id: generateConsequentlyUUID(),
        roomId: generateConsequentlyUUID(),
        creatorId: generateConsequentlyUUID(),
        number: '1',
        body: 'Hello!',
        ack: true,
        correct: CorrectWrong.NULL,
        favorite: false,
        read: false,
        tag: 'Test',
        createdAt: new Date(),
        bookmark: true,
        keywordsFromQuestioner: [],
        keywordsFromSpacy: [
          {
            text: 'Hallo!',
            dep: ['ROOT'],
          },
        ],
        score: 5,
        upvotes: 10,
        downvotes: 5,
        language: Language.AUTO,
        questionerName: 'Test-Author',
        updatedAt: null,
        commentReference: null,
        deletedAt: null,
        commentDepth: 0,
        brainstormingSessionId: null,
        brainstormingWordId: null,
        approved: true,
        gptWriterState: 2,
      }),
    ]);
  }

  override getAckComments(roomId: string): Observable<Comment[]> {
    return this.getComments(roomId).pipe(
      map((comments) => comments.filter((c) => c.ack)),
    );
  }

  override getRejectedComments(roomId: string): Observable<Comment[]> {
    return this.getComments(roomId).pipe(
      map((comments) => comments.filter((c) => !c.ack)),
    );
  }
}
