import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { UserRole } from '../../../models/user-roles.enum';
import { ContentGroup } from '../../../models/content-group';


@Component({
  selector: 'app-content-groups',
  templateUrl: './content-groups.component.html',
  styleUrls: ['./content-groups.component.scss']
})
export class ContentGroupsComponent implements OnInit {

  @Input() public contentGroups: ContentGroup[];
  roomShortId: string;

  constructor (private route: ActivatedRoute,
               private router: Router,
               protected authService: AuthenticationService
  ) {
  }

  ngOnInit() {
    this.roomShortId = this.route.snapshot.paramMap.get('roomId');
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
