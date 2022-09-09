import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { RoomDataService } from '../../../services/util/room-data.service';

@Component({
  selector: 'app-uiregistration',
  templateUrl: './uiregistration.component.html',
  styleUrls: ['./uiregistration.component.scss']
})
export class UIRegistrationComponent implements OnInit, OnDestroy, OnChanges {

  @Input()
  commentId: string;

  constructor(
    private roomDataService: RoomDataService,
  ) {
  }


  ngOnInit(): void {
    // on changes are going to handle init
  }

  ngOnChanges(changes: SimpleChanges) {
    if ('commentId' in changes) {
      const change = changes['commentId'];
      this.unregister(change.previousValue);
      this.register(change.currentValue);
    }
  }

  ngOnDestroy() {
    this.unregister(this.commentId);
  }

  private register(id: string) {
    if (!id) {
      return;
    }
    this.roomDataService.registerUI(id, this);
  }

  private unregister(id: string) {
    if (!id) {
      return;
    }
    this.roomDataService.unregisterUI(id, this);
  }

}
