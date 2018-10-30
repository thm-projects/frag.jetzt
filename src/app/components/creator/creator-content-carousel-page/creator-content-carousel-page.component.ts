import { Component, OnInit } from '@angular/core';
import { ContentType } from '../../../models/content-type.enum';
import { AnswerOption } from '../../../models/answer-option';
import { ContentChoice } from '../../../models/content-choice';
import { ContentText } from '../../../models/content-text';
import { ContentService } from '../../../services/http/content.service';
import { ActivatedRoute } from '@angular/router';
import { Content } from '../../../models/content';

class ContentGroup {
  name: string;
  contentIds: string[];
  autoSort: boolean;

  constructor(name: string, contentIds: string[], autoSort: boolean) {
    this.name = name;
    this.contentIds = contentIds;
    this.autoSort = autoSort;
  }
}

@Component({
  selector: 'app-creator-content-carousel-page',
  templateUrl: './creator-content-carousel-page.component.html',
  styleUrls: ['./creator-content-carousel-page.component.scss']
})
export class CreatorContentCarouselPageComponent implements OnInit {
  ContentType: typeof ContentType = ContentType;

  contents: Content[];
  contentGroup: ContentGroup;

  constructor(private contentService: ContentService,
              private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.contentGroup = JSON.parse(sessionStorage.getItem('contentGroup'));
      this.contentService.getContentsByIds(this.contentGroup.contentIds).subscribe( contents => {
        this.contents = contents;
      });
    });
  }
}
