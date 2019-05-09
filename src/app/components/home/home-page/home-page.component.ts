import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {

  deviceType: string;

  constructor() {
  }

  ngOnInit() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      localStorage.setItem('deviceType', 'mobile');
      this.deviceType = 'mobile';
    } else {
      localStorage.setItem('deviceType', 'desktop');
      this.deviceType = 'desktop';
    }
  }

}
