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
import { isNumeric } from 'rxjs/internal-compatibility';
import { ExplanationDialogComponent } from '../../../shared/_dialogs/explanation-dialog/explanation-dialog.component';
import { copyCSVString, exportBonusArchive } from '../../../../utils/ImportExportMethods';
import { CommentService } from '../../../../services/http/comment.service';
import { MatTableDataSource } from '@angular/material/table';
import { Sort } from '@angular/material/sort';

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
  commentId: string;
  isLoading = true;

  tableDataSource: MatTableDataSource<BonusToken>;
  displayedColumns: string[] = ['questionNumber', 'token', 'button'];

  currentSort: Sort = {
    direction: 'asc',
    active: 'name'
  };

  private modelChanged: Subject<string> = new Subject<string>();
  private subscription: Subscription;
  private debounceTime = 500;

  constructor(private bonusTokenService: BonusTokenService,
              public dialog: MatDialog,
              protected router: Router,
              private dialogRef: MatDialogRef<RoomCreatorPageComponent>,
              private commentService: CommentService,
              private translateService: TranslateService,
              private notificationService: NotificationService) {
  }

  ngOnInit() {
    this.getTokens();
  }

  getTokens(): void {
    this.bonusTokenService.getTokensByRoomId(this.room.id).subscribe(bonusTokens => this.updateTokens(bonusTokens));
  }

  openDeleteSingleBonusDialog(userId: string, commentId: string, index: number): void {
    const dialogRef = this.dialog.open(BonusDeleteComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.multipleBonuses = false;
    dialogRef.afterClosed()
      .subscribe(result => {
        if (result === 'delete') {
          this.deleteBonus(userId, commentId, index);
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

  deleteBonus(userId: string, commentId: string, index: number): void {
    // Delete bonus via bonus-token-service
    const toDelete = this.bonusTokens[index];
    this.bonusTokenService.deleteToken(toDelete.roomId, toDelete.commentId, toDelete.userId).subscribe(_ => {
      this.translateService.get('room-page.token-deleted').subscribe(msg => {
        this.bonusTokens.splice(index, 1);
        this.notificationService.show(msg);
      });
    });
  }

  deleteAllBonuses(): void {
    // Delete all bonuses via bonus-token-service with roomId
    this.bonusTokenService.deleteTokensByRoomId(this.room.id).subscribe(_ => {
      this.translateService.get('room-page.tokens-deleted').subscribe(msg => {
        this.dialogRef.close();
        this.notificationService.show(msg);
      });
    });
  }

  navToComment(commentId: string) {
    this.dialogRef.close();
    const commentURL = `creator/room/${this.room.shortId}/comment/${commentId}`;
    this.router.navigate([commentURL]);
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
  }

  inputToken() {
    const index = this.validateTokenInput(this.value);
    if (index) {
      this.translateService.get('token-validator.valid').subscribe(msg => {
        this.notificationService.show(msg);
      });
      this.valid = true;
    } else {
      this.translateService.get('token-validator.invalid').subscribe(msg => {
        this.notificationService.show(msg);
      });
      this.valid = false;
    }
  }

  updateTokens(bonusTokens: BonusToken[]): void {
    this.bonusTokens = this.bonusTokens.concat(bonusTokens);
    this.bonusTokens.forEach(element => {
      this.commentService.getComment(element.commentId).subscribe(comment => {
        element.questionNumber = comment.number;
      });
    })
    this.lang = localStorage.getItem('currentLang');
    this.subscription = this.modelChanged
      .pipe(
        debounceTime(this.debounceTime),
      )
      .subscribe(_ => {
        this.inputToken();
      });
    this.isLoading = false;
    this.updateTable();
  }

  updateTable(): void {
    const data = [...this.bonusTokens];
    if (this.currentSort?.direction) {
      switch (this.currentSort.active) {
        case 'questionNumber':
          data.sort((a, b) => a.questionNumber - b.questionNumber);
          break;
        case 'token': 
          data.sort((a, b) => 
            a.token.localeCompare(b.token, undefined, { sensitivity: 'base' }));
          break;
        case 'timestamp': 
          data.sort((a, b) => 
            +a.timestamp - +b.timestamp
          );
          break; 
      }
      if(this.currentSort.direction === 'desc'){
        data.reverse();
      }
    }
    this.tableDataSource = new MatTableDataSource(data);
  }

  sortData(sort: Sort): void {
    this.currentSort = sort;
    this.updateTable();
  }

  applyFilter(filterValue: string): void {
    this.tableDataSource.filter = filterValue.trim().toLowerCase();
  }

  timestampTimeConversion(date: Date): number {
    return date.getTime();
  }

  openHelp() {
    const ref = this.dialog.open(ExplanationDialogComponent, {
      autoFocus: false
    });
    ref.componentInstance.translateKey = 'explanation.bonus-archive';
  }

  export() {
    exportBonusArchive(this.translateService,
      this.commentService,
      this.notificationService,
      this.bonusTokenService,
      this.room).subscribe(text => {
        this.translateService.get('bonus-archive-export.file-name', {
          roomName: this.room.name,
          date: text[1]
        }).subscribe(trans => copyCSVString(text[0], trans));
    });
  }

  validateTokenInput(input: any) {
    if (input.length === 8 && isNumeric(input)) {
      return this.bonusTokens.map((c, index) => {
        if (c.token === input) {
          return index;
        }
      });
    }
  }

  valueEqual(token: string) {
    return token.trim() === this.value;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
