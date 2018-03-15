import { Component, OnInit } from '@angular/core';
import { TextContent } from '../text-content';

@Component({
  selector: 'app-creator-text-content',
  templateUrl: './creator-text-content.component.html',
  styleUrls: ['./creator-text-content.component.scss']
})
export class CreatorTextContentComponent implements OnInit {

  content: TextContent = new TextContent('1',
    '1',
    '1',
    'Text Content 1',
    'This is the body of Text Content 1',
    1);

  constructor() {
  }

  ngOnInit() {
  }

  submitContent() {

  }

}
