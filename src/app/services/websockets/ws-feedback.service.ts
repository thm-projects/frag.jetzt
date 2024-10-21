import { Injectable } from '@angular/core';
import { CreateFeedback } from '../../models/messages/create-feedback';
import { GetFeedback } from '../../models/messages/get-feedback';
import { Observable } from 'rxjs';
import { IMessage } from '@stomp/stompjs';
import { getWatcher, send } from 'app/user/state/websocket';

@Injectable({
  providedIn: 'root',
})
export class WsFeedbackService {
  send(feedback: number, roomId: string) {
    const createFeedback = new CreateFeedback(feedback);
    send(
      `/backend/queue/${roomId}.feedback.command`,
      JSON.stringify(createFeedback),
    );
  }

  get(roomId: string) {
    const getFeedback = new GetFeedback();

    send(
      `/backend/queue/${roomId}.feedback.query`,
      JSON.stringify(getFeedback),
    );
  }

  getFeedbackStream(roomId: string): Observable<IMessage> {
    return getWatcher(`/topic/${roomId}.feedback.stream`);
  }
}
