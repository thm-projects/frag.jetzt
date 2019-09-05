import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-cookies',
  templateUrl: './cookies.component.html',
  styleUrls: ['./cookies.component.scss']
})
export class CookiesComponent implements OnInit {

  deviceType: string;

  constructor() { }

  ngOnInit() {
  }

  acceptCookies() {
    localStorage.setItem('cookieAccepted', 'true');
  }

}
