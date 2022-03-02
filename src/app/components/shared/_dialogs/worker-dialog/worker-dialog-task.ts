import { Room } from '../../../../models/room';
import { SpacyKeyword, SpacyService } from '../../../../services/http/spacy.service';
import { CommentService } from '../../../../services/http/comment.service';
import { Comment, Language } from '../../../../models/comment';
import { Language as Lang, LanguagetoolService } from '../../../../services/http/languagetool.service';
import { CreateCommentKeywords, KeywordsResult, KeywordsResultType } from '../../../../utils/create-comment-keywords';
import { TSMap } from 'typescript-map';
import { HttpErrorResponse } from '@angular/common/http';
import { DeepLService } from '../../../../services/http/deep-l.service';

const concurrentCallsPerTask = 4;

export class WorkerDialogTask {

  error: string = null;
  readonly statistics = {
    succeeded: 0,
    badSpelled: 0,
    notSupported: 0,
    failed: 0,
    length: 0
  };
  private readonly _comments: Comment[] = null;
  private readonly _running: boolean[] = null;

  constructor(public readonly room: Room,
              private comments: Comment[],
              private spacyService: SpacyService,
              private deeplService: DeepLService,
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
    CreateCommentKeywords.generateKeywords(this.languagetoolService, this.deeplService, this.spacyService,
      currentComment.body,
      currentComment.brainstormingQuestion,
      !currentComment.keywordsFromQuestioner || currentComment.keywordsFromQuestioner.length === 0,
      currentComment.language.toLowerCase() as Lang)
      .subscribe((result) => this.finishSpacyCall(currentIndex, result, currentComment.language));
  }

  private finishSpacyCall(index: number, result: KeywordsResult, previous: Language): void {
    let undo: () => any = () => '';
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

  private patchToServer(tags: SpacyKeyword[], index: number, language: Language, undo: () => any) {
    const changes = new TSMap<string, string>();
    changes.set('keywordsFromSpacy', JSON.stringify(tags));
    if (language !== null) {
      changes.set('language', language);
    }
    this.commentService.patchComment(this._comments[index], changes).subscribe(_ => {
        this.statistics.succeeded++;
        this.callSpacy(index + concurrentCallsPerTask);
      },
      patchError => {
        undo();
        this.statistics.failed++;
        if (patchError instanceof HttpErrorResponse && patchError.status === 403) {
          this.error = 'forbidden';
        }
        this.callSpacy(index + concurrentCallsPerTask);
      });
  }

}
