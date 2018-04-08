import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { UserRole } from '../../../models/user-roles.enum';
import { NotificationService } from '../../../services/util/notification.service';

@Component({
  selector: 'app-feedback-barometer-page',
  templateUrl: './feedback-barometer-page.component.html',
  styleUrls: ['./feedback-barometer-page.component.scss']
})
export class FeedbackBarometerPageComponent implements OnInit {
  feedback: any = [
    { state: 0, name: 'sentiment_very_satisfied', message: 'I can follow you.', count: 0, },
    { state: 1, name: 'sentiment_satisfied', message: 'Faster, please!', count: 0, },
    { state: 2, name: 'sentiment_dissatisfied', message: 'Slower, please!', count: 0, },
    { state: 3, name: 'sentiment_very_dissatisfied', message: 'You\'ve lost me.', count: 0, },
  ];
  userRole: UserRole;

  dummy = [2, 3, 0, 1]; // dummy data -> delete this with api implementation and add get-data

  constructor(
    private authenticationService: AuthenticationService,
    private notification: NotificationService, ) {}

  ngOnInit() {
    this.userRole = this.authenticationService.getRole();
    this.updateFeedback(this.dummy);
  }

  private updateFeedback(data) {
    const reducer = (accumulator, currentValue) => accumulator + currentValue;
    const sum = data.reduce(reducer);
    for (let i = 0; i < this.feedback.length; i++) {
      this.feedback[i].count = data[i] / sum * 100;
    }
  }

  submitFeedback(state: string) {
    this.dummy[state] += 1; // delete this with api implementation and add submit-data
    this.updateFeedback(this.dummy);
    this.notification.show(`Feedback submitted to room.`);
  }

  toggle() {
    // api feature is yet not implemented
    const temp = 'stopped'; // add status variable
    this.notification.show(`Feedback transmission ${ temp }.`);
  }
}
