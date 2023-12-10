import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SessionService } from '../../../services/util/session.service';
import { MultiLevelDialogComponent } from 'app/components/shared/_dialogs/multi-level-dialog/multi-level-dialog.component';
import { MULTI_LEVEL_ROOM_CREATE } from 'app/components/shared/_dialogs/room-create/room-create.multi-level';
import { generateRoom } from 'app/components/shared/_dialogs/room-create/room-create.executor';

@Component({
  selector: 'app-new-landing',
  templateUrl: './new-landing.component.html',
  styleUrls: ['./new-landing.component.scss'],
})
export class NewLandingComponent implements OnInit {
  constructor(
    public dialog: MatDialog,
    public sessionService: SessionService,
  ) {}

  ngOnInit() {}

  openCreateRoomDialog(): void {
    MultiLevelDialogComponent.open(
      this.dialog,
      MULTI_LEVEL_ROOM_CREATE,
      generateRoom,
    );
  }
}
