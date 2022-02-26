import { Component, OnDestroy, OnInit } from '@angular/core';
import { BonusTokenService } from '../../../../services/http/bonus-token.service';
import { BonusToken } from '../../../../models/bonus-token';
import { Room } from '../../../../models/room';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { RoomCreatorPageComponent } from '../../room-creator-page/room-creator-page.component';
import { BonusDeleteComponent } from '../bonus-delete/bonus-delete.component';
import { NotificationService } from '../../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ExplanationDialogComponent } from '../../../shared/_dialogs/explanation-dialog/explanation-dialog.component';
import { copyCSVString, exportBonusArchive } from '../../../../utils/ImportExportMethods';
import { CommentService } from '../../../../services/http/comment.service';
import { MatTableDataSource } from '@angular/material/table';
import { Sort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { AuthenticationService } from '../../../../services/http/authentication.service';
import { UserRole } from '../../../../models/user-roles.enum';
import { EventService } from '../../../../services/util/event.service';
import { BonusTokenDeleted } from '../../../../models/events/bonus-token-deleted';
import { LanguageService } from '../../../../services/util/language.service';
import { BonusTokenUtilService } from '../../../../services/util/bonus-token-util.service';
import { ModeratorService } from '../../../../services/http/moderator.service';

@Component({
  selector: 'app-bonus-token',
  templateUrl: './bonus-token.component.html',
  styleUrls: ['./bonus-token.component.scss']
})
export class BonusTokenComponent implements OnInit, OnDestroy {
  value: any = '';
  valid = false;
  room: Room;
  bonusTokens: BonusToken[] = [];
  lang: string;
  isLoading = true;
  sub: Subscription;

  tableDataSource: MatTableDataSource<BonusToken>;
  displayedColumns: string[] = ['questionNumber', 'token', 'date', 'button'];

  currentSort: Sort = {
    direction: 'asc',
    active: 'name'
  };

  private selection = new SelectionModel<string>(false, []);
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
    private authenticationService: AuthenticationService,
    private languageService: LanguageService,
    private moderatorService: ModeratorService,
  ) {
    this.languageService.getLanguage().subscribe(lang => {
      this.translateService.use(lang);
      this.lang = lang;
    });
  }

  ngOnInit() {
    this.getTokens();
    this.sub = this.eventService.on<any>('BonusTokenDeleted').subscribe(payload => {
      this.bonusTokens = this.bonusTokens.filter(bt => bt.token !== payload.token);
      this.updateTable(false);
    });
    this.sortData({ active: 'questionNumber', direction: 'asc' });
  }

  getTokens(): void {
    this.bonusTokenService.getTokensByRoomId(this.room.id).subscribe(bonusTokens => this.updateTokens(bonusTokens));
  }

  openDeleteSingleBonusDialog(bonusToken: BonusToken): void {
    const dialogRef = this.dialog.open(BonusDeleteComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.multipleBonuses = false;
    dialogRef.afterClosed()
      .subscribe(result => {
        if (result === 'delete') {
          this.deleteBonus(bonusToken);
        }
      });
  }

  openDeleteAllBonusDialog(): void {
    const dialogRef = this.dialog.open(BonusDeleteComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.multipleBonuses = true;
    dialogRef.afterClosed()
      .subscribe(result => {
        if (result === 'delete') {
          this.deleteAllBonuses();
        }
      });
  }

  deleteBonus(bonusToken: BonusToken): void {
    this.commentService.getComment(bonusToken.commentId).subscribe(comment => {
      this.commentService.toggleFavorite(comment).subscribe(_ => {
        const event = new BonusTokenDeleted(bonusToken.token);
        this.eventService.broadcast(event.type, event.payload);
      });
    });
  }

  deleteAllBonuses(): void {
    this.bonusTokens.forEach(bt => {
      this.deleteBonus(bt);
    });
  }

  navToComment(commentId: string) {
    if (this.authenticationService.getRole() === UserRole.CREATOR) {
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
      this.bonusTokens.forEach(b => {
        if (b.token === this.value) {
          this.navToComment(b.commentId);
        }
      });
    } else {
      this.translateService.get('token-validator.cant-find-comment').subscribe(msg => {
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

  inputChanged(event: any) {
    event.cancelBubble = true;
    this.value = event.target.value;
    this.modelChanged.next(event);
    this.selection.clear();
  }

  inputToken() {
    if (this.validateTokenInput(this.value)) {
      this.selection.select(this.value);
      this.translateService.get('token-validator.valid').subscribe(msg => {
        this.notificationService.show(msg, undefined, undefined, 'snackbar-valid');
      });
      this.valid = true;
    } else {
      this.translateService.get('token-validator.invalid').subscribe(msg => {
        this.notificationService.show(msg, undefined, undefined, 'snackbar-invalid');
      });
      this.valid = false;
    }
  }

  validateTokenInput(input: any): boolean {
    let res = false;
    if (input.length === 8 && this.isNumeric(input)) {
      this.bonusTokens.forEach(bonusToken => {
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
    this.bonusTokens = this.bonusTokenUtilService.setQuestionNumber(this.bonusTokens);
    this.subscription = this.modelChanged
      .pipe(
        debounceTime(this.debounceTime),
      )
      .subscribe(_ => {
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
            data.sort((a, b) => a.questionNumber - b.questionNumber);
            break;
          case 'token':
            data.sort((a, b) =>
              a.token.localeCompare(b.token, undefined, { sensitivity: 'base' }));
            break;
          case 'date':
            data.sort((a, b) =>
              +a.createdAt - +b.createdAt
            );
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
    this.tableDataSource.filter = filterValue.trim().toLowerCase();
  }

  openHelp() {
    const ref = this.dialog.open(ExplanationDialogComponent, {
      autoFocus: false
    });
    ref.componentInstance.translateKey = 'explanation.bonus-archive';
  }

  export() {
    exportBonusArchive(this.translateService, this.commentService, this.notificationService, this.bonusTokenService,
      this.moderatorService, this.room).subscribe(text => {
      this.translateService.get('bonus-archive-export.file-name', {
        roomName: this.room.name,
        date: text[1]
      }).subscribe(trans => copyCSVString(text[0], trans));
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private isNumeric(msg: string): boolean {
    // @ts-ignore
    // eslint-disable-next-line eqeqeq
    return +msg == msg;
  }
}
