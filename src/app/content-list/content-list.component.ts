import { Component, OnInit } from '@angular/core';
import { ContentService } from '../content.service';
import { Content } from '../content';

@Component({
  selector: 'app-content-list',
  templateUrl: './content-list.component.html',
  styleUrls: ['./content-list.component.scss']
})
export class ContentListComponent implements OnInit {
  contents: Content[];

  constructor(private contentService: ContentService) { }

  ngOnInit() {
    this.getContents();
  }

  getContents(): void {
    this.contentService.getContents()
    .subscribe(contents => {
      this.contents = contents;
    });
  }
}
