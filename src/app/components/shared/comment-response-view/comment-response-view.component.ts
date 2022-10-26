import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ForumComment } from '../../../utils/data-accessor';
import { User } from '../../../models/user';
import { UserRole } from '../../../models/user-roles.enum';
import { FilteredDataAccess, getMultiLevelFilterParent, hasKeyword } from '../../../utils/filtered-data-access';
import { SessionService } from '../../../services/util/session.service';
import { RoomDataService } from '../../../services/util/room-data.service';
import { Vote } from '../../../models/vote';
import { FilterType } from '../../../utils/data-filter-object.lib';

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
export class CommentResponseViewComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input()
  owningComment: ForumComment;
  @Input()
  viewInfo: ResponseViewInformation;
  @ViewChild('containerRef')
  containerRef: ElementRef<HTMLDivElement>;
  private _rootComment: ForumComment;
  private _depthLevel: number;
  private _data: FilteredDataAccess;
  private _canNew = false;
  private _keywordFilter: string;
  private EMPTY = [];

  constructor(
    private sessionService: SessionService,
    private roomDataService: RoomDataService,
  ) {
  }

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
    const accessor = this.viewInfo.isModerationComment ?
      this.roomDataService.moderatorDataAccessor : this.roomDataService.dataAccessor;
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

  private attach() {
    this.detach();
    this._data = FilteredDataAccess.buildChildrenAccess(this.sessionService, this.roomDataService, this._rootComment.id);
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
  }

  private detach() {
    this._data?.detach();
    this._data = null;
  }

  private calculateNewParentForKeywords() {
    const parent = getMultiLevelFilterParent(this.owningComment, hasKeyword, this._keywordFilter);
    if (!parent) {
      return;
    }
    this.changeParent(parent[1].id);
  }

}
