import { Component, OnInit } from '@angular/core';
import { StyleDebug } from '../../../../models/debug/StyleDebug';

@Component({
  selector: 'ars-test-base',
  templateUrl: './base-test.component.html',
  styleUrls: ['./base-test.component.scss']
})
export class BaseTestComponent implements OnInit {

  constructor() { }

  ngOnInit() {
    // StyleDebug.border('c');
  }

}
