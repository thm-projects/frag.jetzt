import { Component, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { EmailService } from 'app/services/http/email.service';
import { NotificationService } from 'app/services/util/notification.service';
import { ReplaySubject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-admin-mailing',
  templateUrl: './admin-mailing.component.html',
  styleUrls: ['./admin-mailing.component.scss'],
  standalone: false,
})
export class AdminMailingComponent implements OnDestroy {
  subject: string = '';
  message: string = '';
  isLoading: boolean = false;

  // Subject for managing component cleanup
  private readonly destroyer = new ReplaySubject<boolean>(1);

  constructor(
    private readonly emailService: EmailService,
    private readonly notification: NotificationService,
    private readonly translateService: TranslateService,
  ) {}

  ngOnDestroy(): void {
    // Clean up all subscriptions to prevent memory leaks
    this.destroyer.next(true);
    this.destroyer.complete();
  }

  send(): void {
    if (this.isLoading) return;

    this.isLoading = true;
    const subject = this.subject.trim();
    const message = this.message.trim();

    // Clear form immediately
    this.subject = '';
    this.message = '';

    // Show start notification
    this.showNotification('mailing.start-sending');

    // Send email with proper error handling
    this.emailService
      .sendEmailToAll(subject, message)
      .pipe(takeUntil(this.destroyer))
      .subscribe({
        next: () => {
          this.showNotification('mailing.finish-sending');
        },
        error: (error) => {
          console.error('Email sending failed:', error);
          this.showNotification('mailing.error-sending');
        },
        complete: () => {
          this.isLoading = false;
        },
      });
  }

  /**
   * Helper method to show translated notifications
   * Automatically manages subscription cleanup
   */
  private showNotification(key: string): void {
    this.translateService
      .get(key)
      .pipe(takeUntil(this.destroyer))
      .subscribe((msg) => this.notification.show(msg));
  }
}
