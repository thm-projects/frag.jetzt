import { Injectable } from '@angular/core';
import { WsConnectorService } from '../../services/websockets/ws-connector.service';
import { CreateFeedback } from '../../models/messages/create-feedback';
import { GetFeedback } from '../../models/messages/get-feedback';

@Injectable({
  providedIn: 'root'
})
export class WsFeedbackService {
  constructor(private wsConnector: WsConnectorService) {}

  send(feedback: number, roomId: string) {
    const createFeedback = new CreateFeedback(feedback);
    this.wsConnector.send(`/backend/queue/${roomId}.feedback.command`, JSON.stringify(createFeedback));
  }

  get(roomId: string) {
    const getFeedback = new GetFeedback();

    this.wsConnector.send(`/backend/queue/${roomId}.feedback.query`, JSON.stringify(getFeedback));
  }
}
