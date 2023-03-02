import { Component, OnInit } from '@angular/core';
import { GptService } from 'app/services/http/gpt.service';
import { LanguageService } from '../../../../services/util/language.service';
import { Location } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-gpt-optin-privacy',
  templateUrl: './gpt-optin-privacy.component.html',
  styleUrls: ['./gpt-optin-privacy.component.scss'],
})
export class GptOptInPrivacyComponent implements OnInit {
  constructor(
    public langService: LanguageService,
    private location: Location,
    private dialogRef: MatDialogRef<GptOptInPrivacyComponent>,
  ) {}

  // accepted: boolean = false;

  ngOnInit(): void {}

  onDecline(): void {
    console.log('onDecline');
    this.dialogRef.close(false);
  }

  onAccept(): void {
    console.log('onAccept');
    this.dialogRef.close(true);
  }
}
