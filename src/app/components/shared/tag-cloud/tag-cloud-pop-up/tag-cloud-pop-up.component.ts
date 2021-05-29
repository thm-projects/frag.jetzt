import { Component, OnInit } from '@angular/core';
import { TagCloudDataTagEntry } from '../tag-cloud.data-manager';

@Component({
  selector: 'app-tag-cloud-pop-up',
  templateUrl: './tag-cloud-pop-up.component.html',
  styleUrls: ['./tag-cloud-pop-up.component.scss']
})
export class TagCloudPopUpComponent implements OnInit {

  tag: string;
  tagData: TagCloudDataTagEntry;
  categories: string[];

  constructor() {
  }

  ngOnInit(): void {
  }

  initPopUp(tag: string, tagData: TagCloudDataTagEntry) {
    this.tag = tag;
    this.tagData = tagData;
    this.categories = Array.from(tagData.categories.keys());
  }

}
