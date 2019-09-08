import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-data-protection',
  templateUrl: './data-protection.component.html',
  styleUrls: ['./data-protection.component.scss']
})
export class DataProtectionComponent implements OnInit {

  deviceType: string;
  currentLang: string;

  constructor() {
  }

  ngOnInit() {
    this.currentLang = localStorage.getItem('currentLang');
  }

  dataProtectionConsent(b: boolean) {
    localStorage.setItem('dataProtectionConsent', b.toString());
  }
}
