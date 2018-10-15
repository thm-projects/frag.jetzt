import { Component, OnInit } from '@angular/core';
import { Room } from '../../../models/room';
import { Location } from '@angular/common';
import { RoomService } from '../../../services/http/room.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-room-participant-page',
  templateUrl: './room-participant-page.component.html',
  styleUrls: ['./room-participant-page.component.scss']
})
export class RoomParticipantPageComponent implements OnInit {

  room: Room;
  isLoading = true;

  constructor(private location: Location,
              private roomService: RoomService,
              private route: ActivatedRoute,
              private router: Router) {
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.getRoom(params['roomId']);
    });
  }

  getRoom(id: string): void {
    this.roomService.getRoomByShortId(id)
      .subscribe(room => {
        this.room = room;
        this.isLoading = false;
      });
  }

  /*goToComments(): void {
    this.router.navigate([`/participant/room/${this.room.shortId}/comments`]);
  }*/
}
