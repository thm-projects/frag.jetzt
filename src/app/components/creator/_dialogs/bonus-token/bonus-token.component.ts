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
  private modelChanged: Subject<string> = new Subject<string>();
  private subscription: Subscription;
  private debounceTime = 500;

  constructor(private bonusTokenService: BonusTokenService,
              public dialog: MatDialog,
              protected router: Router,
              private dialogRef: MatDialogRef<RoomCreatorPageComponent>,
              private commentService: CommentService,
              private translationService: TranslateService,
              private notificationService: NotificationService) {
  }

  ngOnInit() {
    this.bonusTokenService.getTokensByRoomId(this.room.id).subscribe(list => {
      list.sort((a, b) => (a.token > b.token) ? 1 : -1);
      this.bonusTokens = list;
    });
    this.lang = localStorage.getItem('currentLang');
    this.subscription = this.modelChanged
      .pipe(
        debounceTime(this.debounceTime),
      )
      .subscribe(_ => {
        this.inputToken();
      });
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
      this.translationService.get('room-page.token-deleted').subscribe(msg => {
        this.bonusTokens.splice(index, 1);
        this.notificationService.show(msg);
      });
    });
  }

  deleteAllBonuses(): void {
    // Delete all bonuses via bonus-token-service with roomId
    this.bonusTokenService.deleteTokensByRoomId(this.room.id).subscribe(_ => {
      this.translationService.get('room-page.tokens-deleted').subscribe(msg => {
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
      this.translationService.get('token-validator.cant-find-comment').subscribe(msg => {
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
      this.translationService.get('token-validator.valid').subscribe(msg => {
        this.notificationService.show(msg);
      });
      this.valid = true;
    } else {
      this.translationService.get('token-validator.invalid').subscribe(msg => {
        this.notificationService.show(msg);
      });
      this.valid = false;
    }
  }

  openHelp() {
    const ref = this.dialog.open(ExplanationDialogComponent, {
      autoFocus: false
    });
    ref.componentInstance.translateKey = 'explanation.bonus-archive';
  }

  export() {
    exportBonusArchive(this.translationService,
      this.commentService,
      this.notificationService,
      this.bonusTokenService,
      this.room).subscribe(text => {
        this.translationService.get('bonus-archive-export.file-name', {
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
