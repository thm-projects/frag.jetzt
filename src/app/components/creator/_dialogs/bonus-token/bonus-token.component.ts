import {Component, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';
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

@Component({
  selector: 'app-bonus-token',
  templateUrl: './bonus-token.component.html',
  styleUrls: ['./bonus-token.component.scss']
})
export class BonusTokenComponent implements OnInit, OnDestroy {
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
              private translationService: TranslateService,
              private notificationService: NotificationService) {
  }

  ngOnInit() {
    this.bonusTokenService.getTokensByRoomId(this.room.id).subscribe(list => {
      this.bonusTokens = list.sort((a, b) => (a.token > b.token) ? 1 : -1);
    });
    this.lang = localStorage.getItem('currentLang');
    this.subscription = this.modelChanged
      .pipe(
        debounceTime(this.debounceTime),
      )
      .subscribe(value => {
        this.inputToken(value);
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

  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildDeclineActionCallback(): () => void {
    return () => this.dialogRef.close();
  }

  inputToken(input: any) {
    const index = this.validateTokenInput(input);
    if(index !== -1) {
      this.translationService.get('token-validator.valid').subscribe(msg => {
        this.notificationService.show(msg);
      });
    } else {
      this.translationService.get('token-validator.invalid').subscribe(msg => {
        this.notificationService.show(msg);
      });
    }
  }

  validateTokenInput(input: any) {
    let ind = -1;
    if(input.length === 8 && isNumeric(input)) {
      this.bonusTokens.map((c, index) => {
        if (c.token === input) {
          ind = index;
        }
      });
    }
    return ind;
  }

  inputChanged(event: any) {
    event.cancelBubble = true;
    this.modelChanged.next(event.target.value);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
