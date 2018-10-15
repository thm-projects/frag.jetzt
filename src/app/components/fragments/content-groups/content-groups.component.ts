import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { UserRole } from '../../../models/user-roles.enum';

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

  @Input() public contentGroups: ContentGroup[];
  displayedContentGroups: ContentGroup[] = [];
  roomShortId: string;

  constructor (private route: ActivatedRoute,
               private router: Router,
               protected authService: AuthenticationService
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

  viewContents(contentGroup: ContentGroup) {
    if (this.authService.getRole() === UserRole.CREATOR) {
      this.router.navigate([`creator/room/${this.roomShortId}/${contentGroup.name}`]);

    } else {
      this.router.navigate([`participant/room/${this.roomShortId}/${contentGroup.name}`]);
    }
    sessionStorage.setItem('contentGroup', JSON.stringify(contentGroup));
  }
}
