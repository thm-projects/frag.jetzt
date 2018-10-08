import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ContentService } from '../../../services/http/content.service';
import { Content } from '../../../models/content';
import { ContentText } from '../../../models/content-text';

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
  roomShortId: string;
  contents: ContentText[];

  constructor (private route: ActivatedRoute,
               private router: Router,
               private contentService: ContentService
  ) {
  }

  ngOnInit() {
    this.roomShortId = this.route.snapshot.paramMap.get('roomId');
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

  getContents(contentGroup: ContentGroup) {
    this.contentService.getContentsByIds(contentGroup.contentIds).subscribe( contents => {
      this.contents = contents;
    });
    this.router.navigate([`creator/room/${this.roomShortId}/${contentGroup.name}`]);
    console.log(contentGroup.contentIds);
  }
}
