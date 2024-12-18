import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { A11yModule } from '@angular/cdk/a11y';
import { KeycloakService } from '../../../services/util/keycloak.service';
import { CommonModule } from '@angular/common';
import { RoomService } from '../../../services/http/room.service';
import { BonusTokenService } from '../../../services/http/bonus-token.service';
import { user$ } from '../../../user/state/user';
import { combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Room } from '../../../models/room';
import { MatList, MatListItem } from '@angular/material/list';

const i18n = I18nLoader.load(rawI18n);

@Component({
  selector: 'app-delete-account-dialog',
  templateUrl: './delete-account-dialog.component.html',
  styleUrls: ['./delete-account-dialog.component.scss'],
  imports: [
    A11yModule,
    MatDialogModule,
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    CommonModule,
    MatListItem,
    MatList,
  ],
})
export class DeleteAccountDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DeleteAccountDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      keycloakService: KeycloakService;
      ownedRooms: Room[];
      tokenCounts;
    },
  ) {}

  protected readonly i18n = i18n;

  static openDialog(
    dialog: MatDialog,
    keycloakService: KeycloakService,
    roomService: RoomService,
    bonusTokenService: BonusTokenService,
  ): MatDialogRef<DeleteAccountDialogComponent> {
    user$
      .pipe(
        switchMap((user) =>
          combineLatest([
            roomService.getCreatorRooms(user.id),
            bonusTokenService.getTokensByUserId(user.id),
          ]).pipe(
            switchMap(([ownedRooms, tokens]) =>
              combineLatest(
                tokens.map((token) =>
                  roomService
                    .getRoom(token.roomId)
                    .pipe(
                      map((room) => ({
                        roomId: room.id,
                        roomName: room.name,
                        token,
                      })),
                    ),
                ),
              ).pipe(
                map((tokenRoomPairs) => {
                  const tokenCounts = tokenRoomPairs.reduce(
                    (acc, pair) => {
                      const existingRoom = acc.find(
                        (room) => room.roomId === pair.roomId,
                      );
                      if (existingRoom) {
                        existingRoom.tokenCount++;
                      } else {
                        acc.push({
                          roomId: pair.roomId,
                          roomName: pair.roomName,
                          tokenCount: 1,
                        });
                      }

                      return acc;
                    },
                    [] as {
                      roomId: string;
                      roomName: string;
                      tokenCount: number;
                    }[],
                  );

                  return { ownedRooms, tokenCounts };
                }),
              ),
            ),
          ),
        ),
      )
      .subscribe(({ ownedRooms, tokenCounts }) => {
        dialog.open(DeleteAccountDialogComponent, {
          data: { keycloakService, ownedRooms, tokenCounts },
        });
      });
    return null;
  }

  onDiscard(): void {
    this.dialogRef.close('discard');
  }

  onDelete(): void {
    user$.subscribe((user) => {
      if (user.isGuest) {
        //todo ins backend
      } else {
        this.data.keycloakService.deleteAccount();
      }
    });
  }

  protected readonly Object = Object;
}
