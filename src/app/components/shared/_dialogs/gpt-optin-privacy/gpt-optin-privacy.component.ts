import { Component, OnInit } from '@angular/core';
import { LanguageService } from '../../../../services/util/language.service';
import { MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';

@Component({
  selector: 'app-gpt-optin-privacy',
  templateUrl: './gpt-optin-privacy.component.html',
  styleUrls: ['./gpt-optin-privacy.component.scss'],
})
export class GptOptInPrivacyComponent implements OnInit {
  constructor(
    public langService: LanguageService,
    private dialogRef: MatDialogRef<GptOptInPrivacyComponent>,
  ) {}

  ngOnInit(): void {}

  onDecline(): void {
    this.dialogRef.close(false);
  }

  onAccept(): void {
    this.dialogRef.close(true);
  }
}
