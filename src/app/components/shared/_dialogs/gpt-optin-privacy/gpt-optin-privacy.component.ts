import { Component, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Language } from 'app/base/language/language';
import { AppStateService } from 'app/services/state/app-state.service';
import { ReplaySubject, takeUntil } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-gpt-optin-privacy',
  templateUrl: './gpt-optin-privacy.component.html',
  styleUrls: ['./gpt-optin-privacy.component.scss'],
  standalone: false,
})
export class GptOptInPrivacyComponent implements OnDestroy {
  currentLanguage: Language;
  private destroyer = new ReplaySubject(1);
  hasScrolledToEnd = false;
  @ViewChild('policyContent') policyContent: ElementRef;

  constructor(
    appState: AppStateService,
    private dialogRef: MatDialogRef<GptOptInPrivacyComponent>,
  ) {
    appState.language$
      .pipe(takeUntil(this.destroyer))
      .subscribe((lang) => (this.currentLanguage = lang));
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
      this.dialogRef.close(true);
    }
  }

  scrollToEnd(): void {
    this.policyContent.nativeElement.scrollTop =
      this.policyContent.nativeElement.scrollHeight;
  }
}
