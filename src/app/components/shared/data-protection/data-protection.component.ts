import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-data-protection',
  templateUrl: './data-protection.component.html',
  styleUrls: ['./data-protection.component.scss']
})
export class DataProtectionComponent implements OnInit {

  deviceType: string;

  constructor(private location: Location) { }

  ngOnInit() {
  }

  goBack() {
    this.location.back();
  }

}
