import { Component, OnInit, Inject } from '@angular/core';
import { FooterComponent } from '../../footer/footer.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-footer-login-dialog',
  templateUrl: './footer-login-dialog.component.html',
  styleUrls: ['./footer-login-dialog.component.scss']
})
export class FooterLoginDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<FooterComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
  }
}
