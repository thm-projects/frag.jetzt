import { Component, OnInit } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { LanguageService } from '../../../../../services/util/language.service';

@Component({
  selector: 'app-introduction-tag-cloud',
  templateUrl: './introduction-tag-cloud.component.html',
  styleUrls: ['./introduction-tag-cloud.component.scss'],
})
export class IntroductionTagCloudComponent implements OnInit {
  constructor(
    private dialogRef: MatDialogRef<IntroductionTagCloudComponent>,
    public languageService: LanguageService,
  ) {}

  ngOnInit(): void {}

  onClose() {
    this.dialogRef.close();
  }
}
