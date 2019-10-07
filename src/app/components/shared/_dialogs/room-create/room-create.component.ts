import { Component, Inject, OnInit } from '@angular/core';
import { RoomService } from '../../../../services/http/room.service';
import { Room } from '../../../../models/room';
import { UserRole } from '../../../../models/user-roles.enum';
import { Router } from '@angular/router';
import { NotificationService } from '../../../../services/util/notification.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { ContentService } from '../../../../services/http/content.service';
import { AuthenticationService } from '../../../../services/http/authentication.service';
import { TranslateService } from '@ngx-translate/core';
import { TSMap } from 'typescript-map';
import { EventService } from '../../../../services/util/event.service';
import { User } from '../../../../models/user';

@Component({
  selector: 'app-room-create',
  templateUrl: './room-create.component.html',
  styleUrls: ['./room-create.component.scss']
})
export class RoomCreateComponent implements OnInit {
  longName: string;
  emptyInputs = false;
  room: Room;
  roomId: string;
  user: User;

  constructor(
    private roomService: RoomService,
    private contentService: ContentService,
    private router: Router,
    private notification: NotificationService,
    public dialogRef: MatDialogRef<RoomCreateComponent>,
    private translateService: TranslateService,
    private authenticationService: AuthenticationService,
    public eventService: EventService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
  }

  ngOnInit() {
    this.translateService.use(localStorage.getItem('currentLang'));
    this.authenticationService.watchUser.subscribe(newUser => this.user = newUser);
  }

  resetEmptyInputs(): void {
    this.emptyInputs = false;
  }

  checkLogin(longRoomName: string) {
    if (!this.user) {
      this.authenticationService.guestLogin(UserRole.CREATOR).subscribe(() => {
        this.addRoom(longRoomName);
      });
    } else {
      this.addRoom(longRoomName);
    }
  }

  addRoom(longRoomName: string) {
    longRoomName = longRoomName.trim();
    if (!longRoomName) {
      this.emptyInputs = true;
      return;
    }
    const newRoom = new Room();
    const commentExtension: TSMap<string, any> = new TSMap();
    newRoom.extensions = new TSMap();
    commentExtension.set('enableModeration', true);
    newRoom.extensions.set('comments', commentExtension);
    newRoom.name = longRoomName;
    newRoom.abbreviation = '00000000';
    newRoom.description = '';
    this.roomService.addRoom(newRoom).subscribe(room => {
      this.room = room;
      let msg1: string;
      let msg2: string;
      this.translateService.get('home-page.created-1').subscribe(msg => { msg1 = msg; });
      this.translateService.get('home-page.created-2').subscribe(msg => { msg2 = msg; });
      this.notification.show(msg1 + longRoomName + msg2);
      this.authenticationService.setAccess(room.shortId, UserRole.CREATOR);
      this.authenticationService.assignRole(UserRole.CREATOR);
      this.router.navigate([`/creator/room/${this.room.shortId}`]);
      this.closeDialog();
    });
  }


  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildCloseDialogActionCallback(): () => void {
    return () => this.closeDialog();
  }


  /**
   * Returns a lambda which executes the dialog dedicated action on call.
   */
  buildRoomCreateActionCallback(room: HTMLInputElement): () => void {
    return () => this.checkLogin(room.value);
  }


  /**
   * Closes the room create dialog on call.
   */
  closeDialog(): void {
    this.dialogRef.close();
  }
}
