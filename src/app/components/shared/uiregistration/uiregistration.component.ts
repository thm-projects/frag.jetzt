import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { RoomDataService } from '../../../services/util/room-data.service';

@Component({
  selector: 'app-uiregistration',
  templateUrl: './uiregistration.component.html',
  styleUrls: ['./uiregistration.component.scss'],
  standalone: false,
})
export class UIRegistrationComponent implements OnDestroy, OnChanges {
  @Input()
  commentId: string;

  constructor(private roomDataService: RoomDataService) {}

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
