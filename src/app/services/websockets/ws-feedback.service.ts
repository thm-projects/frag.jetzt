import { Injectable } from '@angular/core';
import { RxStompService } from '@stomp/ng2-stompjs';
import { CreateFeedback } from '../../models/messages/create-feedback';
import { GetFeedback } from '../../models/messages/get-feedback';

@Injectable({
  providedIn: 'root'
})
export class WsFeedbackService {
  constructor(private rxStompService: RxStompService) {}

  send(feedback: number, roomId: string) {
    const createFeedback = new CreateFeedback(feedback);
    this.rxStompService.publish({
      destination: `/backend/queue/${roomId}.feedback.command`,
      body: JSON.stringify(createFeedback)
    });
  }

  get(roomId: string) {
    const getFeedback = new GetFeedback();

    this.rxStompService.publish({
      destination: `/backend/queue/${roomId}.feedback.query`,
      body: JSON.stringify(getFeedback)
    });
  }
}
