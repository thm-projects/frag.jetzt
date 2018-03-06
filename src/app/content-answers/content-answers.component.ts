import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-content-answers',
  templateUrl: './content-answers.component.html',
  styleUrls: ['./content-answers.component.scss']
})
export class ContentAnswersComponent implements OnInit {

  checked = false;
  indeterminate = false;
  align = 'start';
  disabled = false;

  constructor() { }

  ngOnInit() {
  }

}
