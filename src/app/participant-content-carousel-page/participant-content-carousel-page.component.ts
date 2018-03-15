import { Component, OnInit } from '@angular/core';
import { Content } from '../content';
import { ContentType } from '../content-type';

@Component({
  selector: 'app-participant-content-carousel-page',
  templateUrl: './participant-content-carousel-page.component.html',
  styleUrls: ['./participant-content-carousel-page.component.scss']
})
export class ParticipantContentCarouselPageComponent implements OnInit {
  ContentType: ContentType;

  contents: Content[];

  constructor() {
  }

  ngOnInit() {
  }
}
