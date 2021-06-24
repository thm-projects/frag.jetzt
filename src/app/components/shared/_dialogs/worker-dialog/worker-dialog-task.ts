import { Room } from '../../../../models/room';
import { Model, SpacyService } from '../../../../services/http/spacy.service';
import { CommentService } from '../../../../services/http/comment.service';
import { Comment } from '../../../../models/comment';
import { Language, LanguagetoolService } from '../../../../services/http/languagetool.service';
import { CreateCommentKeywords } from '../../../../utils/create-comment-keywords';
import { TSMap } from 'typescript-map';
import { HttpErrorResponse } from '@angular/common/http';

const concurrentCallsPerTask = 4;

export class WorkerDialogTask {

  error: string = null;
  readonly statistics = {
    succeeded: 0,
    badSpelled: 0,
    failed: 0,
    length: 0
  };
  private readonly _comments: Comment[] = null;
  private readonly _running: boolean[] = null;

  constructor(public readonly room: Room,
              private comments: Comment[],
              private spacyService: SpacyService,
              private commentService: CommentService,
              private languagetoolService: LanguagetoolService,
              private finished: () => void) {
    this._comments = comments;
    this.statistics.length = comments.length;
    this._running = new Array(concurrentCallsPerTask);
    for (let i = 0; i < concurrentCallsPerTask; i++) {
      this._running[i] = true;
      this.callSpacy(i);
    }
  }

  isRunning(): boolean {
    return this._running.some(e => e === true);
  }

  private callSpacy(currentIndex: number) {
    if (this.error || currentIndex >= this._comments.length) {
      this._running[currentIndex % concurrentCallsPerTask] = false;
      if (this._running.every(e => e === false)) {
        if (this.finished) {
          this.finished();
          this.finished = null;
        }
      }
      return;
    }
    const fallbackmodel = (localStorage.getItem('currentLang') || 'de') as Model;
    const currentComment = this._comments[currentIndex];
    CreateCommentKeywords.isSpellingAcceptable(this.languagetoolService, currentComment.body)
      .subscribe(result => {
        if (!result.isAcceptable) {
          this.statistics.badSpelled++;
          this.callSpacy(currentIndex + concurrentCallsPerTask);
          return;
        }
        const model = this.languagetoolService
          .mapLanguageToSpacyModel(result.result.language.detectedLanguage.code as Language);
        this.spacyService.getKeywords(result.text, model === 'auto' ? fallbackmodel : model)
          .subscribe(newKeywords => {
              const changes = new TSMap<string, string>();
              changes.set('keywordsFromSpacy', JSON.stringify(newKeywords));
              this.commentService.patchComment(currentComment, changes).subscribe(_ => {
                  this.statistics.succeeded++;
                },
                patchError => {
                  this.statistics.failed++;
                  if (patchError instanceof HttpErrorResponse && patchError.status === 403) {
                    this.error = 'forbidden';
                  }
                  console.log(patchError);
                }, () => {
                  this.callSpacy(currentIndex + concurrentCallsPerTask);
                });
            },
            keywordError => {
              this.statistics.failed++;
              console.log(keywordError);
              this.callSpacy(currentIndex + concurrentCallsPerTask);
            });
      }, error => {
        this.statistics.failed++;
        console.log(error);
        this.callSpacy(currentIndex + concurrentCallsPerTask);
      });
  }

}
