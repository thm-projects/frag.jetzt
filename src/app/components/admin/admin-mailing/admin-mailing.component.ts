import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { EmailService } from 'app/services/http/email.service';
import { NotificationService } from 'app/services/util/notification.service';

@Component({
  selector: 'app-admin-mailing',
  templateUrl: './admin-mailing.component.html',
  styleUrls: ['./admin-mailing.component.scss'],
})
export class AdminMailingComponent {
  subject: string = '';
  message: string = '';

  constructor(
    private emailService: EmailService,
    private notification: NotificationService,
    private translateService: TranslateService,
  ) {}

  send() {
    const subject = this.subject;
    const message = this.message;
    this.subject = '';
    this.message = '';
    this.translateService
      .get('mailing.start-sending')
      .subscribe((msg) => this.notification.show(msg));
    this.emailService.sendEmailToAll(subject, message).subscribe(() => {
      this.translateService
        .get('mailing.finish-sending')
        .subscribe((msg) => this.notification.show(msg));
    });
  }
}
