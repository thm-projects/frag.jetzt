import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-help',
  templateUrl: './help-page.component.html',
  styleUrls: ['./help-page.component.scss']
})
export class HelpPageComponent implements OnInit {

  deviceType: string;
  currentLang: string;

  constructor() {
  }

  ngOnInit() {
    this.currentLang = localStorage.getItem('currentLang');
  }
}
