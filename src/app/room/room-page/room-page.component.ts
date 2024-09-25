import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Injector,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { M3BodyPaneComponent } from 'modules/m3/components/layout/m3-body-pane/m3-body-pane.component';
import { M3SupportingPaneComponent } from 'modules/m3/components/layout/m3-supporting-pane/m3-supporting-pane.component';
import { ContextPipe } from 'app/base/i18n/context.pipe';
import { CustomMarkdownModule } from 'app/base/custom-markdown/custom-markdown.module';
import { RoomStateService } from 'app/services/state/room-state.service';
import { map } from 'rxjs';
import { MatMenuModule } from '@angular/material/menu';
import { RoomDataService } from 'app/services/util/room-data.service';
import { CommentService } from 'app/services/http/comment.service';
import { MatDialog } from '@angular/material/dialog';
import { RoomNameSettingsComponent } from 'app/components/creator/_dialogs/room-name-settings/room-name-settings.component';
import { RoomDescriptionSettingsComponent } from 'app/components/creator/_dialogs/room-description-settings/room-description-settings.component';
import { NotificationService } from 'app/services/util/notification.service';
import { ModeratorsComponent } from 'app/components/shared/_dialogs/moderators/moderators.component';
import { applyRoomNavigation } from 'app/navigation/room-navigation';
import { RouterModule } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { room } from '../state/room';
import { afterUpdate } from '../state/room-updates';
import { SessionService } from 'app/services/util/session.service';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-room-page',
  standalone: true,
  imports: [
    M3BodyPaneComponent,
    M3SupportingPaneComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    ContextPipe,
    CustomMarkdownModule,
    MatMenuModule,
    RouterModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatDividerModule,
  ],
  templateUrl: './room-page.component.html',
  styleUrl: './room-page.component.scss',
})
export class RoomPageComponent {
  protected readonly room = room;
  protected readonly mode = computed(() => {
    return this.room()?.mode === 'PLE' ? 'ple' : 'ars';
  });
  protected readonly isPrivileged = signal<boolean>(false);
  protected readonly i18n = i18n;
  protected readonly commentCounter = signal<number>(0);
  protected readonly answerCounter = signal<number>(0);
  protected readonly moderatedCommentCounter = signal<number>(0);
  protected readonly moderatedAnswerCounter = signal<number>(0);
  protected readonly activeUsers = signal('?');
  protected readonly moderatorCount = signal<number | string>('?');
  private commentService = inject(CommentService);
  private dialog = inject(MatDialog);
  private notificationService = inject(NotificationService);
  private roomState = inject(RoomStateService);
  private changeDetector = inject(ChangeDetectorRef);

  constructor() {
    const updates = afterUpdate.subscribe((u) => {
      if (u.type === 'RoomPatched') {
        this.changeDetector.detectChanges();
      }
    });
    const roomDataService = inject(RoomDataService);
    const sessionService = inject(SessionService);
    const destroyRef = inject(DestroyRef);
    const injector = inject(Injector);
    const sub = applyRoomNavigation(injector).subscribe();
    destroyRef.onDestroy(() => {
      sub.unsubscribe();
      updates.unsubscribe();
    });
    effect(
      (onCleanup) => {
        const sub1 = this.roomState.assignedRole$
          .pipe(map((role) => role !== 'Participant'))
          .subscribe((privileged) => this.isPrivileged.set(privileged));
        this.updateResponseCounter();
        const sub2 = roomDataService.dataAccessor
          .receiveUpdates([
            { type: 'CommentCreated', finished: true },
            { type: 'CommentDeleted', finished: true },
            { type: 'CommentPatched', finished: true, updates: ['ack'] },
          ])
          .subscribe(() => {
            this.updateResponseCounter();
          });
        const sub3 = roomDataService.observeUserCount().subscribe((text) => {
          this.activeUsers.set(text);
        });
        const sub4 = sessionService
          .getModeratorsOnce()
          .subscribe((moderators) => {
            this.moderatorCount.set(moderators.length);
          });
        onCleanup(() => {
          sub1.unsubscribe();
          sub2.unsubscribe();
          sub3.unsubscribe();
          sub4.unsubscribe();
        });
      },
      { allowSignalWrites: true },
    );
  }

  protected editSessionName() {
    const dialogRef = this.dialog.open(RoomNameSettingsComponent, {
      disableClose: true,
    });
    dialogRef.componentInstance.editRoom = this.room();
  }

  protected editSessionDescription() {
    const dialogRef = this.dialog.open(RoomDescriptionSettingsComponent, {
      minWidth: 'var(--toastui-dialog-min-width)',
      autoFocus: false,
      disableClose: true,
    });
    dialogRef.componentInstance.editRoom = this.room();
  }

  protected copyShortId(): void {
    navigator.clipboard
      .writeText(
        `${window.location.protocol}//${window.location.host}/participant/room/${this.room().shortId}`,
      )
      .then(
        () => {
          this.notificationService.show(i18n().copySuccessful);
        },
        () => {
          this.notificationService.show(i18n().copyFailed);
        },
      );
  }

  protected showModeratorsDialog(): void {
    const dialogRef = this.dialog.open(ModeratorsComponent, {
      width: '400px',
    });
    dialogRef.componentInstance.roomId = this.room().id;
    dialogRef.componentInstance.isCreator =
      this.roomState.getCurrentAssignedRole() === 'Creator';
  }

  private updateResponseCounter(): void {
    this.commentService
      .countByRoomId([
        { roomId: this.room().id, ack: true },
        { roomId: this.room().id, ack: false },
      ])
      .subscribe((commentCounter) => {
        this.commentCounter.set(commentCounter[0].questionCount);
        this.answerCounter.set(commentCounter[0].responseCount);
        this.moderatedCommentCounter.set(commentCounter[1].questionCount);
        this.moderatedAnswerCounter.set(commentCounter[1].responseCount);
      });
  }
}
