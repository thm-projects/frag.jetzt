import {
  Component,
  OnDestroy,
  ViewChild,
  ElementRef,
  OnInit,
} from '@angular/core';
import { Language } from 'app/base/language/language';
import { AppStateService } from 'app/services/state/app-state.service';
import { ReplaySubject, takeUntil } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';
import { PrivacyConsentService } from 'app/services/state/privacy-consent.service';

@Component({
  selector: 'app-gpt-optin-privacy',
  templateUrl: './gpt-optin-privacy.component.html',
  styleUrls: ['./gpt-optin-privacy.component.scss'],
  standalone: false,
})
export class GptOptInPrivacyComponent implements OnInit, OnDestroy {
  currentLanguage: Language;
  private readonly destroyer = new ReplaySubject(1);
  hasScrolledToEnd = false;
  showAcceptButton = true;

  @ViewChild('policyContent') policyContent: ElementRef;

  constructor(
    appState: AppStateService,
    private readonly dialogRef: MatDialogRef<GptOptInPrivacyComponent>,
    private readonly privacyConsentService: PrivacyConsentService,
  ) {
    appState.language$
      .pipe(takeUntil(this.destroyer))
      .subscribe((lang) => (this.currentLanguage = lang));
  }

  ngOnInit(): void {
    // Check if the user has previously accepted the privacy policy
    this.showAcceptButton =
      !this.privacyConsentService.hasAcceptedPrivacyPolicy();
  }

  ngOnDestroy(): void {
    this.destroyer.next(true);
    this.destroyer.complete();
  }

  onScroll(): void {
    const element = this.policyContent.nativeElement;
    const isAtBottom =
      Math.abs(
        element.scrollHeight - element.scrollTop - element.clientHeight,
      ) <= 2;
    if (isAtBottom) {
      this.hasScrolledToEnd = true;
    } else if (this.hasScrolledToEnd) {
      // If the user has scrolled away from the bottom, disable the accept button again
      this.hasScrolledToEnd = false;
    }
  }

  onAccept(): void {
    if (this.hasScrolledToEnd) {
      // Save the user's choice
      this.privacyConsentService.acceptPrivacyPolicy();
      this.dialogRef.close(true);
    }
  }

  onReject(): void {
    // Mark that the user has rejected the policy
    this.privacyConsentService.rejectPrivacyPolicy();
    this.dialogRef.close(false);
  }

  scrollToEnd(): void {
    this.policyContent.nativeElement.scrollTop =
      this.policyContent.nativeElement.scrollHeight;
  }
}
