import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-help',
  templateUrl: './help-page.component.html',
  styleUrls: ['./help-page.component.scss']
})
export class HelpPageComponent implements OnInit {

  deviceType: string;
  constructor(private location: Location) { }

  ngOnInit() {
  }

  goBack() {
   this.location.back();
 }
}
