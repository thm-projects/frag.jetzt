import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeScript } from '@angular/platform-browser';

@Component({
  selector: 'app-imprint',
  templateUrl: './imprint.component.html',
  styleUrls: ['./imprint.component.scss']
})
export class ImprintComponent implements OnInit {
  deviceType: string;
  currentLang: string;
  safeURL: SafeScript;


  constructor(private dialogRef: MatDialogRef<ImprintComponent>,
              private sanitizer: DomSanitizer) {
  }

  ngOnInit() {
    this.currentLang = localStorage.getItem('currentLang');
    this.safeURL = this.sanitizer
      .bypassSecurityTrustResourceUrl('https://www.openhub.net/p/frag-jetzt/widgets/project_factoids_stats');
  }

  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildDeclineActionCallback(): () => void {
    return () => this.dialogRef.close();
  }
}
