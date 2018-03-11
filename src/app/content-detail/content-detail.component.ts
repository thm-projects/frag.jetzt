import { Component, OnInit } from '@angular/core';
import { Content } from '../content';
import { ContentService } from '../content.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-content-detail',
  templateUrl: './content-detail.component.html',
  styleUrls: ['./content-detail.component.scss']
})
export class ContentDetailComponent implements OnInit {
  content: Content = null;

  constructor(
    private contentService: ContentService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.getContent(params['id']);
    });
  }

  getContent(id: string): void {
    this.contentService.getContent(id)
      .subscribe(content => this.content = content);
  }
}
