import { Component, OnDestroy, OnInit } from '@angular/core';
import { SessionService } from '../../../../services/util/session.service';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../../../../services/util/notification.service';
import { RoomService } from '../../../../services/http/room.service';
import {
  ROOM_ROLE_MAPPER,
  RoomStateService,
} from 'app/services/state/room-state.service';
import { UserRole } from 'app/models/user-roles.enum';
import { ReplaySubject, takeUntil } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CategoryListCreatorComponent } from 'app/room/dialogs/category-list-creator/category-list-creator.component';

/**
 * Dialog component for editing comment tags/categories
 * Allows users to assign or remove tags from comments
 */
@Component({
  selector: 'app-edit-comment-tag',
  templateUrl: './edit-comment-tag.component.html',
  styleUrls: ['./edit-comment-tag.component.scss'],
  standalone: false,
})
export class EditCommentTagComponent implements OnInit, OnDestroy {
  // Currently selected tag for the comment
  selectedTag: string;

  // User's role in the current room
  role: UserRole;

  // Subject for managing component cleanup
  private readonly destroyer = new ReplaySubject<boolean>(1);

  constructor(
    private readonly dialogRef: MatDialogRef<EditCommentTagComponent>,
    public sessionInfo: SessionService,
    private readonly dialog: MatDialog,
    private readonly translateService: TranslateService,
    private readonly notificationService: NotificationService,
    private readonly roomService: RoomService,
    private readonly roomState: RoomStateService,
  ) {}

  ngOnInit(): void {
    // Subscribe to user role changes in the current room
    this.roomState.assignedRole$
      .pipe(takeUntil(this.destroyer))
      .subscribe((role) => (this.role = ROOM_ROLE_MAPPER[role] || 0));
  }

  ngOnDestroy(): void {
    // Clean up subscriptions to prevent memory leaks
    this.destroyer.next(true);
    this.destroyer.complete();
  }

  /**
   * Opens the category management dialog
   * Only available for moderators and above
   */
  openAllTags(): void {
    this.dialog.open(CategoryListCreatorComponent);
  }

  /**
   * Creates a callback function to close the dialog without saving
   * @returns Function that closes the dialog
   */
  buildCloseDialogActionCallback(): () => void {
    return () => this.dialogRef.close();
  }

  /**
   * Creates a callback function to save the selected tag and close dialog
   * @returns Function that closes the dialog with the selected tag
   */
  buildSaveActionCallback(): () => void {
    return () => this.dialogRef.close(this.selectedTag);
  }
}
