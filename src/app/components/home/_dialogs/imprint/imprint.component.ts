import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-imprint',
  templateUrl: './imprint.component.html',
  styleUrls: ['./imprint.component.scss']
})
export class ImprintComponent implements OnInit {
  deviceType: string;
  currentLang: string;
  safeURLfrontend: SafeResourceUrl;
  safeURLbackend: SafeResourceUrl;


  constructor(private dialogRef: MatDialogRef<ImprintComponent>,
              private sanitizer: DomSanitizer) {
  }

  ngOnInit() {
    this.currentLang = localStorage.getItem('currentLang');
    this.safeURLfrontend = this.sanitizer
      .bypassSecurityTrustResourceUrl('https://www.openhub.net/p/frag-jetzt/widgets/project_partner_badge');
    this.safeURLbackend = this.sanitizer
      .bypassSecurityTrustResourceUrl('https://www.openhub.net/p/frag-jetzt-backend/widgets/project_partner_badge');
  }

  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildDeclineActionCallback(): () => void {
    return () => this.dialogRef.close();
  }
}
