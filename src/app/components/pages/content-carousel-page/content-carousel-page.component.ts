import { Component, OnInit } from '@angular/core';
import { Content } from '../../../models/content';
import { ContentType } from '../../../models/content-type.enum';

@Component({
  selector: 'app-content-carousel-page',
  templateUrl: './content-carousel-page.component.html',
  styleUrls: ['./content-carousel-page.component.scss']
})
export class ContentCarouselPageComponent implements OnInit {
  ContentType: ContentType;

  contents: Content[];

  constructor() {
  }

  ngOnInit() {
  }
}
