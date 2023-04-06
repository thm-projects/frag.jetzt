import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CommentService } from '../http/comment.service';
import { TSMap } from 'typescript-map';
import { Comment, Language } from '../../models/comment';
import { generateConsequentlyUUID } from '../../utils/test-utils';
import { CorrectWrong } from '../../models/correct-wrong.enum';
import { map } from 'rxjs/operators';
import { QuillUtils, SerializedDelta } from '../../utils/quill-utils';

@Injectable()
export class CommentServiceMock extends CommentService {
  constructor() {
    super(null);
  }

  patchComment(comment: Comment, changes: TSMap<string, any>): Observable<any> {
    changes.forEach((value, key) => {
      comment[key] = value;
    });
    return of(comment);
  }

  getComments(roomId: string): Observable<Comment[]> {
    return of([
      new Comment({
        id: generateConsequentlyUUID(),
        roomId: generateConsequentlyUUID(),
        creatorId: generateConsequentlyUUID(),
        number: '1',
        body: QuillUtils.deserializeDelta('["Hello!\n"]' as SerializedDelta),
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

  getAckComments(roomId: string): Observable<Comment[]> {
    return this.getComments(roomId).pipe(
      map((comments) => comments.filter((c) => c.ack)),
    );
  }

  getRejectedComments(roomId: string): Observable<Comment[]> {
    return this.getComments(roomId).pipe(
      map((comments) => comments.filter((c) => !c.ack)),
    );
  }
}
