import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DialogConfirmActionButtonType } from '../../../shared/dialog/dialog-action-buttons/dialog-action-buttons.component';
import { MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-data-protection',
  templateUrl: './data-protection.component.html',
  styleUrls: ['./data-protection.component.scss']
})
export class DataProtectionComponent implements OnInit {

  deviceType: string;
  currentLang: string;
  confirmButtonType: DialogConfirmActionButtonType;

  constructor(private router: Router,
              private dialogRef: MatDialogRef<DataProtectionComponent>) {
              this.confirmButtonType = DialogConfirmActionButtonType.Primary;
  }

  ngOnInit() {
    this.currentLang = localStorage.getItem('currentLang');
  }

  accept() {
    this.dataProtectionConsent(true);
    this.dialogRef.close(true);
  }

  decline() {
    this.dataProtectionConsent(false);

    // TODO: Delete all user data (backend)

    if (this.router.url === '/home') {

      // if current route is /home : do nothing

    } else {      // otherwise: go there
      this.router.navigate(['/home']);
    }
    this.dialogRef.close(false);
  }

  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildDeclineActionCallback(): () => void {
    return () => this.decline();
  }

  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildConfirmActionCallback(): () => void {
    return () => this.accept();
  }


  dataProtectionConsent(b: boolean) {
    localStorage.setItem('dataProtectionConsent', b.toString());
  }
}
