import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {

  mobile = true;

  constructor() { }

  ngOnInit() {
    if (window.innerWidth > 500) {
      this.mobile = false;
    }
  }

}
