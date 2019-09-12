import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-data-protection',
  templateUrl: './data-protection.component.html',
  styleUrls: ['./data-protection.component.scss']
})
export class DataProtectionComponent implements OnInit {

  deviceType: string;
  currentLang: string;

  constructor(private router: Router) {
  }

  ngOnInit() {
    this.currentLang = localStorage.getItem('currentLang');
  }

  accept() {
    this.dataProtectionConsent(true);
  }

  decline() {
    this.dataProtectionConsent(false);

    // TODO: Delete all user data (backend)

    if (this.router.url === '/home') {

      // if current route is /home : do nothing

    } else {      // otherwise: go there
      this.router.navigate(['/home']);
    }
  }

  dataProtectionConsent(b: boolean) {
    localStorage.setItem('dataProtectionConsent', b.toString());
  }
}
