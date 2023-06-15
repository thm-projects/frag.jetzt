import { Component } from '@angular/core';
import { LanguageService } from '../../../../../services/util/language.service';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-introduction-question-wall',
  templateUrl: './introduction-question-wall.component.html',
  styleUrls: ['./introduction-question-wall.component.scss'],
})
export class IntroductionQuestionWallComponent {
  constructor(
    private dialogRef: MatDialogRef<IntroductionQuestionWallComponent>,
    public languageService: LanguageService,
  ) {}

  onClose() {
    this.dialogRef.close();
  }
}
