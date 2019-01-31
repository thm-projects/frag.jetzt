import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { UserRole } from '../../../models/user-roles.enum';
import { NotificationService } from '../../../services/util/notification.service';
import { RxStompService } from '@stomp/ng2-stompjs';
import { Message } from '@stomp/stompjs';
import { CreateFeedback } from '../../../models/messages/create-feedback';
import { GetFeedback } from '../../../models/messages/get-feedback';

/* ToDo: Use TranslateService */

@Component({
  selector: 'app-feedback-barometer-page',
  templateUrl: './feedback-barometer-page.component.html',
  styleUrls: ['./feedback-barometer-page.component.scss']
})
export class FeedbackBarometerPageComponent implements OnInit {
  feedback: any = [
    { state: 0, name: 'sentiment_very_satisfied', message: 'Ich kann folgen.', count: 0, },
    { state: 1, name: 'sentiment_satisfied', message: 'Schneller, bitte!', count: 0, },
    { state: 2, name: 'sentiment_dissatisfied', message: 'Langsamer, bitte!', count: 0, },
    { state: 3, name: 'sentiment_very_dissatisfied', message: 'Abgehängt.', count: 0, }
  ];
  userRole: UserRole;
  roomId: string;

  constructor(
    private authenticationService: AuthenticationService,
    private notification: NotificationService,
    private rxStompService: RxStompService,
    private route: ActivatedRoute, ) {
      this.roomId = this.route.snapshot.params.roomId;
    }

  ngOnInit() {
    this.userRole = this.authenticationService.getRole();

    this.rxStompService.watch(`/room/${this.roomId}/feedback.stream`).subscribe((message: Message) => {
      this.parseIncomingMessage(message);
    });

    const getFeedback = new GetFeedback();

    this.rxStompService.publish({
      destination: `/backend/room/${this.roomId}/feedback.query`,
      body: JSON.stringify(getFeedback)
    });
  }

  private updateFeedback(data) {
    const reducer = (accumulator, currentValue) => accumulator + currentValue;
    const sum = data.reduce(reducer);
    for (let i = 0; i < this.feedback.length; i++) {
      this.feedback[i].count = data[i] / sum * 100;
    }
  }

  submitFeedback(state: number) {
    const createFeedback = new CreateFeedback(state);
    this.rxStompService.publish({
      destination: `/backend/room/${this.roomId}/feedback.command`,
      body: JSON.stringify(createFeedback)
    });
  }

  toggle() {
    // api feature is yet not implemented
    const temp = 'stopped'; // add status variable
    this.notification.show(`Feedback transmission ${ temp }.`);
  }

  parseIncomingMessage(message: Message) {
    const values = JSON.parse(message.body).payload.values;
    this.updateFeedback(values);
  }
}
