import { Component, OnInit } from '@angular/core';
import { UserRole } from '../../../models/user-roles.enum';
import { Router } from '@angular/router';
import { User } from '../../../models/user';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  user: User;

  constructor(
    public router: Router
  ) { }

  ngOnInit() {
  }

  goToHomepage() {
    const role: UserRole = this.user !== undefined ? this.user.role : undefined;
    let route: string;

    switch (role) {
      case UserRole.PARTICIPANT:
        route = '/participant';
        break;
      case UserRole.CREATOR:
        route = '/creator';
        break;
      default:
        route = '/';
    }
    this.router.navigate([route]);
  }
}
