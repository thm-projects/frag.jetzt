import { Component, OnInit } from '@angular/core';
import { Content } from '../content';
import { ContentService } from '../content.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-content',
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.scss']
})
export class ContentDetailComponent implements OnInit {
  content: Content = null;

  constructor(
    private contentCreationService: ContentService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.getContent(params['id']);
    });
  }

  getContent(id: string): void {
    this.contentCreationService.getContent(id)
      .subscribe(content => this.content = content);
  }
}
