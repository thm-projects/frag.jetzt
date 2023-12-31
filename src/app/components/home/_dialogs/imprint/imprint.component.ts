import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Language } from 'app/services/http/languagetool.service';
import { AppStateService } from 'app/services/state/app-state.service';
import { ReplaySubject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-imprint',
  templateUrl: './imprint.component.html',
  styleUrls: ['./imprint.component.scss'],
})
export class ImprintComponent implements OnInit, OnDestroy {
  safeURLfrontend: SafeResourceUrl;
  safeURLbackend: SafeResourceUrl;
  currentLanguage: Language;
  private destroyer = new ReplaySubject(1);

  constructor(
    private dialogRef: MatDialogRef<ImprintComponent>,
    private sanitizer: DomSanitizer,
    appState: AppStateService,
  ) {
    appState.language$
      .pipe(takeUntil(this.destroyer))
      .subscribe((lang) => (this.currentLanguage = lang));
  }

  ngOnInit() {
    /**
    this.safeURLfrontend = this.sanitizer
      .bypassSecurityTrustResourceUrl('https://www.openhub.net/p/frag-jetzt/widgets/project_partner_badge');
    this.safeURLbackend = this.sanitizer
      .bypassSecurityTrustResourceUrl('https://www.openhub.net/p/frag-jetzt-backend/widgets/project_partner_badge');
     */
  }

  ngOnDestroy(): void {
    this.destroyer.next(true);
    this.destroyer.complete();
  }

  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildDeclineActionCallback(): () => void {
    return () => this.dialogRef.close();
  }
}
