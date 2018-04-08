import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-footer-imprint',
  templateUrl: './footer-imprint.component.html',
  styleUrls: ['./footer-imprint.component.scss']
})
export class FooterImprintComponent implements OnInit {
  step = 0;

  constructor() { }

  ngOnInit() {
  }

  setStep(index: number) {
    this.step = index;
  }

  nextStep() {
    this.step++;
  }

  prevStep() {
    this.step--;
  }

}
