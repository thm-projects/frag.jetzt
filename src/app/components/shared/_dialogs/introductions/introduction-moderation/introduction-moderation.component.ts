import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { LanguageService } from '../../../../../services/util/language.service';

@Component({
  selector: 'app-introduction-moderation',
  templateUrl: './introduction-moderation.component.html',
  styleUrls: ['./introduction-moderation.component.scss'],
})
export class IntroductionModerationComponent {
  constructor(
    private dialogRef: MatDialogRef<IntroductionModerationComponent>,
    public languageService: LanguageService,
  ) {}

  onClose() {
    this.dialogRef.close();
  }
}
