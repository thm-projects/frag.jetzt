import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { ForumComment } from '../../../utils/data-accessor';
import { User } from '../../../models/user';
import { UserRole } from '../../../models/user-roles.enum';
import {
  FilteredDataAccess,
  getMultiLevelFilterParent,
  hasKeyword,
} from '../../../utils/filtered-data-access';
import { SessionService } from '../../../services/util/session.service';
import { RoomDataService } from '../../../services/util/room-data.service';
import { Vote } from '../../../models/vote';
import {
  FilterType,
  SortType,
  SortTypeKey,
} from '../../../utils/data-filter-object.lib';
import { QuillUtils } from 'app/utils/quill-utils';
import { TSMap } from 'typescript-map';
import { WriteCommentComponent } from '../write-comment/write-comment.component';
import { MatDialog } from '@angular/material/dialog';
import { CommentService } from 'app/services/http/comment.service';

export interface ResponseViewInformation {
  user: User;
  userRole: UserRole;
  votes: { [commentId: string]: Vote };
  mods: Set<string>;
  roomId: string;
  roomOwner: string;
  roomThreshold: number;
  isModerationComment: boolean;
}

@Component({
  selector: 'app-comment-response-view',
  templateUrl: './comment-response-view.component.html',
  styleUrls: ['./comment-response-view.component.scss'],
})
export class CommentResponseViewComponent
  implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input()
  owningComment: ForumComment;
  @Input()
  viewInfo: ResponseViewInformation;
  @ViewChild('containerRef')
  containerRef: ElementRef<HTMLDivElement>;
  sortType: SortTypeKey;
  sortReverse: boolean;
  private _rootComment: ForumComment;
  private _depthLevel: number;
  private _data: FilteredDataAccess;
  private _canNew = false;
  private _keywordFilter: string;
  private EMPTY = [];

  constructor(
    private sessionService: SessionService,
    private roomDataService: RoomDataService,
    private dialog: MatDialog,
    private commentService: CommentService,
  ) {}

  get keywordFilter() {
    return this._keywordFilter;
  }

  @Input()
  set keywordFilter(filterStr: string) {
    if (!this.viewInfo) {
      console.error('Place viewInfo before keywordFilter!');
      return;
    }
    const changed = this._keywordFilter !== filterStr;
    if (!changed) {
      return;
    }
    this._keywordFilter = filterStr;
    if (!this._keywordFilter) {
      this.changeParent(this.owningComment.id);
    } else {
      this.calculateNewParentForKeywords();
    }
  }

  ngOnInit(): void {
    if (!this._rootComment) {
      this._rootComment = this.owningComment;
      this._depthLevel = 1;
      this.attach();
    }
  }

  ngAfterViewInit() {
    const width = this.containerRef.nativeElement.clientWidth;
    this._canNew = width >= 400;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this._keywordFilter) {
      this.changeParent(this.owningComment.id);
    } else {
      this.calculateNewParentForKeywords();
    }
  }

  ngOnDestroy() {
    this.detach();
  }

  getData() {
    return this._data?.getCurrentData() ?? this.EMPTY;
  }

  getDepthLevel() {
    return this._depthLevel;
  }

  canNew() {
    return this._canNew;
  }

  changeParent(id: string): boolean {
    const accessor = this.viewInfo.isModerationComment
      ? this.roomDataService.moderatorDataAccessor
      : this.roomDataService.dataAccessor;
    const comment = accessor.getDataById(id)?.comment;
    if (!comment) {
      return false;
    }
    let loopComment = comment;
    let level = 1;
    while (loopComment != null && loopComment.id !== this.owningComment.id) {
      ++level;
      loopComment = loopComment.parent;
    }
    if (loopComment?.id !== this.owningComment.id) {
      return false;
    }
    this._depthLevel = level;
    this._rootComment = comment;
    this.attach();
    return true;
  }

  applySortingByKey(type: SortTypeKey, reverse = false) {
    const filter = this._data.dataFilter;
    filter.sortType = SortType[type];
    filter.sortReverse = reverse;
    this._data.dataFilter = filter;
    this.refresh();
  }

  editQuestion(comment: ForumComment) {
    const ref = this.dialog.open(WriteCommentComponent, {
      autoFocus: false,
    });
    const instance = ref.componentInstance;
    instance.confirmLabel = 'send';
    instance.brainstormingData =
      this.sessionService.currentRoom.brainstormingSession;
    instance.tags = this.sessionService.currentRoom.tags;
    instance.isQuestionerNameEnabled = false;
    instance.isModerator = this.sessionService.currentRole > 0;
    instance.rewriteCommentData = comment;
    instance.onClose = (newComment) => {
      ref.close();
      if (!newComment) {
        return;
      }
      const changes = new TSMap<keyof ForumComment, any>();
      const newBody = QuillUtils.serializeDelta(newComment.body);
      if (newBody !== QuillUtils.serializeDelta(comment.body)) {
        changes.set('body', newBody);
      }
      if (newComment.language !== comment.language) {
        changes.set('language', newComment.language);
      }
      const newKeyQuestioner = JSON.stringify(
        newComment.keywordsFromQuestioner,
      );
      if (newKeyQuestioner !== JSON.stringify(comment.keywordsFromQuestioner)) {
        changes.set('keywordsFromQuestioner', newKeyQuestioner);
      }
      const newKeySpaCy = JSON.stringify(newComment.keywordsFromSpacy);
      if (newKeyQuestioner !== JSON.stringify(comment.keywordsFromSpacy)) {
        changes.set('keywordsFromSpacy', newKeySpaCy);
      }
      if (changes.size() === 0) {
        return;
      }
      this.commentService.patchComment(comment, changes).subscribe();
    };
  }

  private attach() {
    this.detach();
    this._data = FilteredDataAccess.buildChildrenAccess(
      this.sessionService,
      this.roomDataService,
      this._rootComment.id,
    );
    this._data.attach({
      userId: this.viewInfo.user.id,
      ownerId: this.viewInfo.roomOwner,
      roomId: this.viewInfo.roomId,
      moderatorIds: this.viewInfo.mods,
      threshold: this.viewInfo.roomThreshold,
    });
    if (this._keywordFilter) {
      const f = this._data.dataFilter;
      f.filterType = FilterType.Keyword;
      f.filterCompare = this._keywordFilter;
      this._data.dataFilter = f;
    }
    this.refresh();
  }

  private refresh() {
    const f = this._data.dataFilter;
    this.sortType = SortType[f.sortType];
    this.sortReverse = f.sortReverse;
  }

  private detach() {
    this._data?.detach();
    this._data = null;
  }

  private calculateNewParentForKeywords() {
    const parent = getMultiLevelFilterParent(
      this.owningComment,
      hasKeyword,
      this._keywordFilter,
    );
    if (!parent) {
      return;
    }
    this.changeParent(parent[1].id);
  }
}
