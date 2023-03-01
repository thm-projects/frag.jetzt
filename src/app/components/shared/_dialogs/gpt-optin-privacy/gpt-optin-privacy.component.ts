import { Component, OnInit } from '@angular/core';
import { GptService } from 'app/services/http/gpt.service';
import { LanguageService } from '../../../../services/util/language.service';

@Component({
  selector: 'app-gpt-optin-privacy',
  templateUrl: './gpt-optin-privacy.component.html',
  styleUrls: ['./gpt-optin-privacy.component.scss'],
})
export class GptOptInPrivacyComponent implements OnInit {
  constructor(public langService: LanguageService) {}

  // accepted: boolean = false;

  ngOnInit(): void {}

  onDecline(): void {
    console.log('onDecline');
  }

  onAccept(): void {
    console.log('onAccept');
    //this.accepted = true;
  }
}
