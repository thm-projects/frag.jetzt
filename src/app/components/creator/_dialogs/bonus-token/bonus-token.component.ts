import { Component, OnInit } from '@angular/core';
import { BonusTokenService } from '../../../../services/http/bonus-token.service';
import { BonusToken } from '../../../../models/bonus-token';
import { Room } from '../../../../models/room';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { RoomCreatorPageComponent } from '../../room-creator-page/room-creator-page.component';
import { BonusDeleteComponent } from '../bonus-delete/bonus-delete.component';
import { NotificationService } from '../../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import {fromEvent, Observable} from "rxjs";
import {debounceTime, distinctUntilChanged, map} from "rxjs/operators";
import {flatMap} from "rxjs/internal/operators";

@Component({
  selector: 'app-bonus-token',
  templateUrl: './bonus-token.component.html',
  styleUrls: ['./bonus-token.component.scss']
})
export class BonusTokenComponent implements OnInit {
  room: Room;
  bonusTokens: BonusToken[] = [];
  lang: string;

  constructor(private bonusTokenService: BonusTokenService,
              public dialog: MatDialog,
              protected router: Router,
              private dialogRef: MatDialogRef<RoomCreatorPageComponent>,
              private translationService: TranslateService,
              private notificationService: NotificationService) {
  }

  ngOnInit() {
    this.bonusTokenService.getTokensByRoomId(this.room.id).subscribe(list => {
      this.bonusTokens = list.sort((a, b) => {
        return (a.token > b.token) ? 1 : -1;
      });
    });
    this.lang = localStorage.getItem('currentLang');
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

  filterToken(event: any) {
    const observable = fromEvent(event.target, 'keyup')
      .pipe(
        map(value => event.target.value),
        debounceTime(1000),
        distinctUntilChanged(),
        flatMap((search) => {
          // call the service
        })
      )
      .subscribe((data) => {
        // data
      });

    observable.subscribe((data) => {
      // data
    });
  }
}
