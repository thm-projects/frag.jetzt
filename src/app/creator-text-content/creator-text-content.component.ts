import { Component, OnInit } from '@angular/core';
import { TextContent } from '../text-content';
import { ContentService } from '../content.service';

@Component({
  selector: 'app-creator-text-content',
  templateUrl: './creator-text-content.component.html',
  styleUrls: ['./creator-text-content.component.scss']
})
export class CreatorTextContentComponent implements OnInit {

  content: TextContent = new TextContent('1',
    '1',
    '0',
    '',
    '',
    1);

  constructor(private contentService: ContentService) {
  }

  ngOnInit() {
  }

  submitContent() {
    if (this.content.contentId === '1') {
      this.contentService.addContent(this.content).subscribe();
    } else {
      // ToDo: Implement function in service
      // this.contentService.updateContent(this.content).subscribe();
    }
  }
}
