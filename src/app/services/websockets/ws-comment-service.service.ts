import { Injectable } from '@angular/core';
import { Comment } from '../../models/comment';
import { RxStompService } from '@stomp/ng2-stompjs';


@Injectable({
  providedIn: 'root'
})
export class WsCommentServiceService {

  constructor(private rxStompService: RxStompService) { }

  add(comment: Comment): void {

  }


}
