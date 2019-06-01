import { ContentChoice } from './../../../models/content-choice';
import { ContentService } from './../../../services/http/content.service';
import { ContentGroup } from './../../../models/content-group';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-content-presentation',
  templateUrl: './content-presentation.component.html',
  styleUrls: ['./content-presentation.component.scss']
})
export class ContentPresentationComponent implements OnInit {

  contents: ContentChoice[];
  contentGroup: ContentGroup;
  labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  isLoading = true;

  constructor(private contentService: ContentService) {
  }

  ngOnInit() {
      this.contentGroup = JSON.parse(sessionStorage.getItem('contentGroup'));
      this.contentService.getContentChoiceByIds(this.contentGroup.contentIds).subscribe( contents => {
        this.contents = contents;
        this.isLoading = false;
      });
  }

}
