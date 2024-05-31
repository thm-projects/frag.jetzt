import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { BonusTokenService } from '../../../../services/http/bonus-token.service';
import { BonusToken } from '../../../../models/bonus-token';
import { Room } from '../../../../models/room';
import { RoomCreatorPageComponent } from '../../room-creator-page/room-creator-page.component';
import { BonusDeleteComponent } from '../bonus-delete/bonus-delete.component';
import { NotificationService } from '../../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ExplanationDialogComponent } from '../../../shared/_dialogs/explanation-dialog/explanation-dialog.component';
import {
  copyCSVString,
  exportBonusArchive,
} from '../../../../utils/ImportExportMethods';
import { CommentService } from '../../../../services/http/comment.service';
import { MatSort, Sort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { UserRole } from '../../../../models/user-roles.enum';
import { EventService } from '../../../../services/util/event.service';
import { BonusTokenDeleted } from '../../../../models/events/bonus-token-deleted';
import { BonusTokenUtilService } from '../../../../services/util/bonus-token-util.service';
import { ModeratorService } from '../../../../services/http/moderator.service';
import { numberSorter } from '../../../../models/comment';
import { AppStateService } from 'app/services/state/app-state.service';
import {
  ROOM_ROLE_MAPPER,
  RoomStateService,
} from 'app/services/state/room-state.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { I18nLoader } from 'app/base/i18n/i18n-loader';

import i18nRaw from './bonus-token.i18n.json';
import { i18nContext } from 'app/base/i18n/i18n-context';
const i18n = I18nLoader.load(i18nRaw);

@Component({
  selector: 'app-bonus-token',
  templateUrl: './bonus-token.component.html',
  styleUrls: ['./bonus-token.component.scss'],
})
export class BonusTokenComponent implements OnInit, OnDestroy {
  value: string = '';
  valid = false;
  room: Room;
  bonusTokens: BonusToken[] = [];
  isLoading = true;
  sub: Subscription;
  protected readonly i18n = i18n;

  tableDataSource: MatTableDataSource<BonusToken>;
  displayedColumns: string[] = ['questionNumber', 'token', 'date', 'button'];
  @ViewChild(MatSort) sort: MatSort;
  currentSort: Sort = {
    direction: 'asc',
    active: 'name',
  };

  protected selection = new SelectionModel<string>(false, []);
  private modelChanged: Subject<string> = new Subject<string>();
  private subscription: Subscription;
  private debounceTime = 800;

  constructor(
    private bonusTokenService: BonusTokenService,
    private bonusTokenUtilService: BonusTokenUtilService,
    public eventService: EventService,
    public dialog: MatDialog,
    protected router: Router,
    private dialogRef: MatDialogRef<RoomCreatorPageComponent>,
    private commentService: CommentService,
    private translateService: TranslateService,
    private notificationService: NotificationService,
    private appState: AppStateService,
    private roomState: RoomStateService,
    private moderatorService: ModeratorService,
  ) {}

  ngOnInit() {
    this.getTokens();
    this.updateTable(false);
    this.tableDataSource.filterPredicate = function (
      data,
      filter: string,
    ): boolean {
      return data.token.toLowerCase().includes(filter);
    };
    this.sub = this.eventService
      .on<{ token: string }>('BonusTokenDeleted')
      .subscribe((payload) => {
        this.bonusTokens = this.bonusTokens.filter(
          (bt) => bt.token !== payload.token,
        );
        this.updateTable(false);
      });
  }

  getTokens(): void {
    this.bonusTokenService
      .getTokensByRoomId(this.room.id)
      .subscribe((bonusTokens) => this.updateTokens(bonusTokens));
  }

  openDeleteSingleBonusDialog(bonusToken: BonusToken): void {
    const dialogRef = this.dialog.open(BonusDeleteComponent, {
      width: '400px',
    });
    dialogRef.componentInstance.multipleBonuses = false;
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'delete') {
        this.deleteBonus(bonusToken);
      }
    });
  }

  openDeleteAllBonusDialog(): void {
    const dialogRef = this.dialog.open(BonusDeleteComponent, {
      width: '400px',
    });
    dialogRef.componentInstance.multipleBonuses = true;
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'delete') {
        this.deleteAllBonuses();
      }
    });
  }

  deleteBonus(bonusToken: BonusToken): void {
    this.commentService
      .getComment(bonusToken.commentId)
      .subscribe((comment) => {
        this.commentService.toggleFavorite(comment).subscribe(() => {
          const event = new BonusTokenDeleted(bonusToken.token);
          this.eventService.broadcast(event.type, event.payload);
        });
      });
  }

  deleteAllBonuses(): void {
    this.bonusTokens.forEach((bt) => {
      this.deleteBonus(bt);
    });
  }

  navToComment(commentId: string) {
    if (
      ROOM_ROLE_MAPPER[this.roomState.getCurrentAssignedRole()] ===
      UserRole.CREATOR
    ) {
      this.dialogRef.close();
      const commentURL = `creator/room/${this.room.shortId}/comment/${commentId}`;
      this.router.navigate([commentURL]);
    } else {
      this.dialogRef.close();
      const commentURL = `participant/room/${this.room.shortId}/comment/${commentId}`;
      this.router.navigate([commentURL]);
    }
  }

  navToCommentByValue() {
    if (this.valid) {
      this.bonusTokens.forEach((b) => {
        if (b.token === this.value) {
          this.navToComment(b.commentId);
        }
      });
    } else {
      this.translateService.get(i18n().cantFindComment).subscribe((msg) => {
        this.notificationService.show(msg);
      });
    }
  }

  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildDeclineActionCallback(): () => void {
    return () => this.dialogRef.close();
  }

  inputChanged(event: Event) {
    event.cancelBubble = true;
    this.value = (event.target as HTMLInputElement).value;
    this.modelChanged.next(this.value);
    this.selection.clear();
  }

  inputToken() {
    if (this.validateTokenInput(this.value)) {
      this.selection.select(this.value);
      this.translateService.get(i18n().valid).subscribe((msg) => {
        this.notificationService.show(
          msg,
          undefined,
          undefined,
          'snackbar-valid',
        );
      });
      this.valid = true;
    } else {
      this.translateService.get(i18n().invalid).subscribe((msg) => {
        this.notificationService.show(
          msg,
          undefined,
          undefined,
          'snackbar-invalid',
        );
      });
      this.valid = false;
    }
  }

  validateTokenInput(input: string): boolean {
    let res = false;
    if (input.length === 8 && this.isNumeric(input)) {
      this.bonusTokens.forEach((bonusToken) => {
        if (bonusToken.token === input) {
          res = true;
        }
      });
    }
    return res;
  }

  valueEqual(token: string) {
    return token.trim() === this.value;
  }

  updateTokens(bonusTokens: BonusToken[]): void {
    this.bonusTokens = bonusTokens;
    this.bonusTokens = this.bonusTokenUtilService.setQuestionNumber(
      this.bonusTokens,
    );
    this.subscription = this.modelChanged
      .pipe(debounceTime(this.debounceTime))
      .subscribe(() => {
        this.inputToken();
      });
    this.isLoading = false;
    this.updateTable(false);
  }

  updateTable(sort: boolean): void {
    const data = [...this.bonusTokens];
    if (sort) {
      if (this.currentSort?.direction) {
        switch (this.currentSort.active) {
          case 'questionNumber':
            data.sort((a, b) =>
              numberSorter(a.questionNumber, b.questionNumber),
            );
            break;
          case 'token':
            data.sort((a, b) =>
              a.token.localeCompare(b.token, undefined, {
                sensitivity: 'base',
              }),
            );
            break;
          case 'date':
            data.sort((a, b) => +a.createdAt - +b.createdAt);
            break;
        }
        if (this.currentSort.direction === 'desc') {
          data.reverse();
        }
      }
    }
    this.tableDataSource = new MatTableDataSource(data);
  }

  sortData(sort: Sort): void {
    this.currentSort = sort;
    this.updateTable(true);
  }

  applyFilter(filterValue: string): void {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.tableDataSource.filter = filterValue;
  }

  openHelp() {
    const ref = this.dialog.open(ExplanationDialogComponent, {
      autoFocus: false,
    });
    ref.componentInstance.translateKey = 'explanation.bonus-archive';
  }

  export() {
    exportBonusArchive(
      this.translateService,
      this.commentService,
      this.notificationService,
      this.bonusTokenService,
      this.moderatorService,
      this.room,
    ).subscribe((text) => {
      copyCSVString(
        text[0],
        i18nContext(i18n().fileName, {
          roomName: this.room.name,
          date: text[1],
        }),
      );
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  getFormattedDate(date: Date) {
    const d = new Date(date);
    return (
      d.toLocaleDateString(this.appState.getCurrentLanguage(), {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      }) +
      ' ' +
      d.toLocaleTimeString(this.appState.getCurrentLanguage(), {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  }

  private isNumeric(msg: string): boolean {
    return /^\d+$/.test(msg);
  }
}
