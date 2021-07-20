import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-quiz-now',
  templateUrl: './quiz-now.component.html',
  styleUrls: ['./quiz-now.component.scss']
})
export class QuizNowComponent implements OnInit {

  url = 'https://arsnova.click';
  urlSafe: SafeResourceUrl;

  constructor(public sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
  }

}
