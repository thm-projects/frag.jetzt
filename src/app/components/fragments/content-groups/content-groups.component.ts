import { Component, Input, OnInit} from '@angular/core';

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
  selector: 'app-content-groups',
  templateUrl: './content-groups.component.html',
  styleUrls: ['./content-groups.component.scss']
})
export class ContentGroupsComponent implements OnInit {

  @Input() public contentGroups: {[key: string]: [string]};
  displayedContentGroups: ContentGroup[] = [];

  constructor () {
  }

  ngOnInit() {
    Object.keys(this.contentGroups).forEach(key => {
      if (key === '') {
        const cg = new ContentGroup(
          'Default Content Group',
          this.contentGroups[key]['contentIds'],
          this.contentGroups[key]['autoSort']);
        this.displayedContentGroups.push(cg);
      } else {
        const cg = new ContentGroup(
          key,
          this.contentGroups[key]['contentIds'],
          this.contentGroups[key]['autoSort']);
        this.displayedContentGroups.push(cg);
      }
    });
  }
}
