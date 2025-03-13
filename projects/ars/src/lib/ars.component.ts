import { Component, OnInit } from '@angular/core';

@Component({
    template: `
    <p>
      ars works!
    </p>
  `,
    styles: [],
    standalone: false
})
// tslint:disable-next-line:directive-class-suffix
export class ArsComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
