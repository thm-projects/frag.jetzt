import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ForumComment } from '../../../utils/data-accessor';
import { User } from '../../../models/user';
import { UserRole } from '../../../models/user-roles.enum';
import { FilteredDataAccess } from '../../../utils/filtered-data-access';
import { SessionService } from '../../../services/util/session.service';
import { RoomDataService } from '../../../services/util/room-data.service';
import { Vote } from '../../../models/vote';

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
  styleUrls: ['./comment-response-view.component.scss']
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

  constructor(
    private sessionService: SessionService,
    private roomDataService: RoomDataService,
  ) {
  }

  ngOnInit(): void {
    this._rootComment = this.owningComment;
    this._depthLevel = 1;
    this._data = FilteredDataAccess.buildChildrenAccess(this.sessionService, this.roomDataService, this._rootComment.id);
    this._data.attach({
      userId: this.viewInfo.user.id,
      ownerId: this.viewInfo.roomOwner,
      roomId: this.viewInfo.roomId,
      moderatorIds: this.viewInfo.mods,
      threshold: this.viewInfo.roomThreshold,
    });
  }

  ngAfterViewInit() {
    const width = this.containerRef.nativeElement.clientWidth;
    this._canNew = width >= 400;
  }

  ngOnDestroy() {
    this._data.detach();
  }

  getData() {
    return this._data.getCurrentData();
  }

  getDepthLevel() {
    return this._depthLevel;
  }

  canNew() {
    return this._canNew;
  }

}
