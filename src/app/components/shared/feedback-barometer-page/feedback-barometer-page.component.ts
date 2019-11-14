import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { UserRole } from '../../../models/user-roles.enum';
import { NotificationService } from '../../../services/util/notification.service';
import { Message } from '@stomp/stompjs';
import { WsFeedbackService } from '../../../services/websockets/ws-feedback.service';
import { Subscription } from 'rxjs';

/* ToDo: Use TranslateService */

@Component({
  selector: 'app-feedback-barometer-page',
  templateUrl: './feedback-barometer-page.component.html',
  styleUrls: ['./feedback-barometer-page.component.scss']
})
export class FeedbackBarometerPageComponent implements OnInit, OnDestroy {
  feedback: any = [
    { state: 0, name: 'sentiment_very_satisfied', message: 'Ich kann folgen.', count: 0, },
    { state: 1, name: 'sentiment_satisfied', message: 'Schneller, bitte!', count: 0, },
    { state: 2, name: 'sentiment_dissatisfied', message: 'Langsamer, bitte!', count: 0, },
    { state: 3, name: 'sentiment_very_dissatisfied', message: 'Abgehängt.', count: 0, }
  ];
  userRole: UserRole;
  roomId: string;
  protected sub: Subscription;

  constructor(
    private authenticationService: AuthenticationService,
    private notification: NotificationService,
    private wsFeedbackService: WsFeedbackService,
    private route: ActivatedRoute, ) {
      this.roomId = localStorage.getItem(`roomId`);
    }

  ngOnInit() {
    this.userRole = this.authenticationService.getRole();

    this.sub = this.wsFeedbackService.getFeedbackStream(this.roomId).subscribe((message: Message) => {
      this.parseIncomingMessage(message);
    });

    this.wsFeedbackService.get(this.roomId);
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  private updateFeedback(data) {
    const reducer = (accumulator, currentValue) => accumulator + currentValue;
    const sum = data.reduce(reducer);
    for (let i = 0; i < this.feedback.length; i++) {
      this.feedback[i].count = data[i] / sum * 100;
    }
  }

  submitFeedback(state: number) {
    this.wsFeedbackService.send(state, this.roomId);
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
