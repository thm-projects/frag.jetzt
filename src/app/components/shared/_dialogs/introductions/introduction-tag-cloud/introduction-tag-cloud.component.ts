import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { LanguageService } from '../../../../../services/util/language.service';

@Component({
  selector: 'app-introduction-tag-cloud',
  templateUrl: './introduction-tag-cloud.component.html',
  styleUrls: ['./introduction-tag-cloud.component.scss'],
})
export class IntroductionTagCloudComponent {
  constructor(
    private dialogRef: MatDialogRef<IntroductionTagCloudComponent>,
    public languageService: LanguageService,
  ) {}

  onClose() {
    this.dialogRef.close();
  }
}
