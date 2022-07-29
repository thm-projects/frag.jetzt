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
      new Comment(
        generateConsequentlyUUID(),
        generateConsequentlyUUID(),
        QuillUtils.deserializeDelta('["Hello!\n"]' as SerializedDelta),
        true,
        CorrectWrong.NULL,
        false,
        new Date(),
        false,
        0,
        true,
        false,
        true,
        'Test',
        [],
        [{
          text: 'Hallo!', dep: ['ROOT'],
        }],
        0,
        0,
        Language.AUTO,
        'Tester',
        false,
        null,
        null,
        0
      ),
    ]);
  }

  getAckComments(roomId: string): Observable<Comment[]> {
    return this.getComments(roomId).pipe(
      map(comments => comments.filter(c => c.ack)),
    );
  }

  getRejectedComments(roomId: string): Observable<Comment[]> {
    return this.getComments(roomId).pipe(
      map(comments => comments.filter(c => !c.ack)),
    );
  }
}
