import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RoomService } from '../../../services/http/room.service';
import { ContentGroup } from '../../../models/content-group';
import { Room } from '../../../models/room';

/* TODO: Use TranslateService */

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})

export class StatisticsComponent implements OnInit {

  room: Room;
  contentGroups: ContentGroup[];

  constructor(
    private route: ActivatedRoute,
    private roomService: RoomService) {
  }

  ngOnInit(): void {
    this.getRoom(localStorage.getItem('roomId'));
  }

  getRoom(id: string): void {
    this.roomService.getRoom(id).subscribe(room => {
      this.contentGroups = room.contentGroups;
    });
  }

}
