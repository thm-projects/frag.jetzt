import { Component, OnInit } from '@angular/core';
import { Content } from '../../../models/content';
import { ContentType } from '../../../models/content-type.enum';

@Component({
  selector: 'app-participant-content-carousel-page',
  templateUrl: './content-carousel.component.html',
  styleUrls: ['./content-carousel.component.scss']
})
export class ParticipantContentCarouselPageComponent implements OnInit {
  ContentType: ContentType;

  contents: Content[];

  constructor() {
  }

  ngOnInit() {
  }
}
