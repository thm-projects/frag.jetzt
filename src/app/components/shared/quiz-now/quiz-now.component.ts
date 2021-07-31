import {Component, OnInit} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
@Component({
  selector: 'app-quiz-now',
  templateUrl: './quiz-now.component.html',
  styleUrls: ['./quiz-now.component.scss']
})
export class QuizNowComponent {
  urlSafe: SafeResourceUrl;

  constructor(public sanitizer: DomSanitizer) { }

  ngOnInit() {
    this.urlSafe= this.sanitizer.bypassSecurityTrustResourceUrl("https://arsnova.click/");
  }
}
