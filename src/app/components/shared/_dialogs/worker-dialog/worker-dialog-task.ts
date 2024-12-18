import { Room } from '../../../../models/room';
import { SpacyKeyword } from '../../../../services/http/spacy.service';
import { CommentService } from '../../../../services/http/comment.service';
import { Comment, Language } from '../../../../models/comment';
import { TSMap } from 'typescript-map';
import { HttpErrorResponse } from '@angular/common/http';
import { Injector } from '@angular/core';

const concurrentCallsPerTask = 4;

export class WorkerDialogTask {
  error: string = null;
  readonly statistics = {
    succeeded: 0,
    badSpelled: 0,
    notSupported: 0,
    failed: 0,
    length: 0,
  };
  private readonly _comments: Comment[] = null;
  private readonly _running: boolean[] = null;

  constructor(
    public readonly room: Room,
    comments: Comment[],
    private finished: () => void,
    injector: Injector,
    private commentService: CommentService = injector.get(CommentService),
  ) {
    this._comments = comments;
    this.statistics.length = comments.length;
    this._running = new Array(concurrentCallsPerTask);
    for (let i = 0; i < concurrentCallsPerTask; i++) {
      this._running[i] = true;
      this.callSpacy(i);
    }
  }

  isRunning(): boolean {
    return this._running.some((e) => e === true);
  }

  private callSpacy(currentIndex: number) {
    if (this.error || currentIndex >= this._comments.length) {
      this._running[currentIndex % concurrentCallsPerTask] = false;
      if (this._running.every((e) => e === false)) {
        if (this.finished) {
          this.finished();
          this.finished = null;
        }
      }
      return;
    }
    const currentComment = this._comments[currentIndex];
    if (currentComment.brainstormingSessionId !== null) {
      this.statistics.succeeded++;
      this.callSpacy(currentIndex + concurrentCallsPerTask);
      return;
    }
    /*this._keywordExtractor
      .generateKeywords(
        currentComment.body,
        false,
        currentComment.language.toLowerCase() as Lang,
      )
      .subscribe((result) => this.finishSpacyCall(currentIndex, result));*/
  }

  private finishSpacyCall(index: number, result): void {
    let undo: () => unknown = () => '';
    const KeywordsResultType = null;
    if (result.resultType === KeywordsResultType.BadSpelled) {
      this.statistics.badSpelled++;
      undo = () => this.statistics.badSpelled--;
    } else if (result.resultType === KeywordsResultType.LanguageNotSupported) {
      this.statistics.notSupported++;
      undo = () => this.statistics.notSupported--;
    } else if (result.resultType === KeywordsResultType.Failure) {
      this.statistics.failed++;
      undo = () => this.statistics.failed--;
    }
    if (result.language === Language.AUTO) {
      result.language = null;
    }
    this.patchToServer(result.keywords, index, result.language, undo);
  }

  private patchToServer(
    tags: SpacyKeyword[],
    index: number,
    language: Language,
    undo: () => unknown,
  ) {
    const changes = new TSMap<string, string>();
    changes.set('keywordsFromSpacy', JSON.stringify(tags));
    if (language !== null) {
      changes.set('language', language);
    }

    this.commentService.patchComment(this._comments[index], changes).subscribe({
      next: () => {
        this.statistics.succeeded++;
        this.callSpacy(index + concurrentCallsPerTask);
      },
      error: (patchError) => {
        undo();
        this.statistics.failed++;
        if (
          patchError instanceof HttpErrorResponse &&
          patchError.status === 403
        ) {
          this.error = 'forbidden';
        }
        this.callSpacy(index + concurrentCallsPerTask);
      },
    });
  }
}
