import { Component, OnInit } from '@angular/core';
import { IconActionARIA, IconActionArias } from '../comment-action';

@Component({
  selector: 'app-comment-a11y-elements',
  templateUrl: './comment-a11y-elements.component.html',
  styleUrls: ['./comment-a11y-elements.component.scss'],
})
export class CommentA11yElementsComponent implements OnInit {
  a11yData = Object.keys(IconActionArias).reduce((acc, e) => {
    acc.push(...IconActionArias[e]);
    return acc;
  }, [] as IconActionARIA[]);

  constructor() {}

  ngOnInit(): void {}
}
