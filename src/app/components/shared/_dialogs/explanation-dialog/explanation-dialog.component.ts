import { Component, Input, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-explanation-dialog',
  templateUrl: './explanation-dialog.component.html',
  styleUrls: ['./explanation-dialog.component.scss'],
})
export class ExplanationDialogComponent implements OnInit {
  @Input() translateKey: string;
  data: string;

  constructor(
    private translateService: TranslateService,
    private dialogRef: MatDialogRef<ExplanationDialogComponent>,
  ) {}

  ngOnInit(): void {
    this.translateService
      .get(this.translateKey)
      .subscribe((text) => (this.data = text));
  }

  buildConfirmAction() {
    return () => this.dialogRef.close();
  }
}
