import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-cookies',
  templateUrl: './cookies.component.html',
  styleUrls: ['./cookies.component.scss']
})
export class CookiesComponent implements OnInit {

  deviceType: string;
  currentLang: string;

  constructor() { }

  ngOnInit() {
    this.currentLang = localStorage.getItem('currentLang');
  }

  acceptCookies() {
    localStorage.setItem('cookieAccepted', 'true');
  }

  exitApp() {
    // TODO somehow exit the app, since the user didn't accept cookie usage
  }
}
