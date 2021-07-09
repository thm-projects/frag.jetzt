import { Room } from '../../../../models/room';
import { SpacyKeyword, SpacyService } from '../../../../services/http/spacy.service';
import { CommentService } from '../../../../services/http/comment.service';
import { Comment, Language } from '../../../../models/comment';
import { Language as Lang, LanguagetoolService } from '../../../../services/http/languagetool.service';
import { CreateCommentKeywords } from '../../../../utils/create-comment-keywords';
import { TSMap } from 'typescript-map';
import { HttpErrorResponse } from '@angular/common/http';
import { Model } from '../../../../services/http/spacy.interface';

const concurrentCallsPerTask = 4;

enum FinishType {
  completed,
  badSpelled,
  failed
}

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
    const currentComment = this._comments[currentIndex];
    CreateCommentKeywords.isSpellingAcceptable(this.languagetoolService, currentComment.body)
      .subscribe(result => {
        if (!result.isAcceptable) {
          this.finishSpacyCall(FinishType.badSpelled, currentIndex);
          return;
        }
        const commentModel = currentComment.language.toLowerCase();
        const model = commentModel !== 'auto' ? commentModel.toLowerCase() as Model :
          this.languagetoolService.mapLanguageToSpacyModel(result.result.language.detectedLanguage.code as Lang);
        if (model === 'auto') {
          this.finishSpacyCall(FinishType.badSpelled, currentIndex);
          return;
        }
        this.spacyService.getKeywords(result.text, model)
          .subscribe(newKeywords =>
              this.finishSpacyCall(FinishType.completed, currentIndex, newKeywords, model.toUpperCase() as Language),
            __ => this.finishSpacyCall(FinishType.failed, currentIndex));
      }, _ => this.finishSpacyCall(FinishType.failed, currentIndex));
  }

  private finishSpacyCall(finishType: FinishType, index: number, tags?: SpacyKeyword[], lang?: Language): void {
    if (finishType === FinishType.completed) {
      this.patchToServer(tags, index, lang);
    } else if (finishType === FinishType.badSpelled) {
      this.statistics.badSpelled++;
      this.patchToServer([], index, Language.auto);
    } else {
      this.statistics.failed++;
      this.callSpacy(index + concurrentCallsPerTask);
    }
  }

  private patchToServer(tags: SpacyKeyword[], index: number, language: Language) {
    const changes = new TSMap<string, string>();
    changes.set('keywordsFromSpacy', JSON.stringify(tags));
    changes.set('language', language);
    this.commentService.patchComment(this._comments[index], changes).subscribe(_ => {
        this.statistics.succeeded++;
        this.callSpacy(index + concurrentCallsPerTask);
      },
      patchError => {
        this.statistics.failed++;
        if (patchError instanceof HttpErrorResponse && patchError.status === 403) {
          this.error = 'forbidden';
        }
        this.callSpacy(index + concurrentCallsPerTask);
      });
  }

}
