import { Component, OnInit } from '@angular/core';
import { ContentService } from '../content.service';
import { Content } from '../content';
import { ActivatedRoute } from '@angular/router';
import { RoomService } from '../room.service';

@Component({
  selector: 'app-content-list',
  templateUrl: './content-list.component.html',
  styleUrls: ['./content-list.component.scss']
})
export class ContentListComponent implements OnInit {
  contents: Content[];

  constructor(
    private contentService: ContentService,
    private route: ActivatedRoute,
    private roomService: RoomService,
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.getRoom(params['roomId']);
    });
  }

  getRoom(id: string): void {
    this.roomService.getRoom(id).subscribe(
      params => {
        this.getContents(params['id']);
      });
  }

  getContents(roomId: string): void {
    this.contentService.getContents(roomId)
    .subscribe(contents => {
      this.contents = contents;
    });
  }
}
