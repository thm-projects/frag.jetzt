import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-gpt-optin-privacy',
  templateUrl: './gpt-optin-privacy.component.html',
  styleUrls: ['./gpt-optin-privacy.component.scss'],
})
export class GptOptinPrivacyComponent implements OnInit {
  constructor(private location: Location) {}

  ngOnInit(): void {}

  onDecline(): void {
    console.log('onDecline');
    this.location.back();
  }

  onAccept(): void {
    console.log('onAccept');
  }
}
