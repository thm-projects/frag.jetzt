import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { LanguageService } from '../../../../../services/util/language.service';

@Component({
  selector: 'app-introduction-brainstorming',
  templateUrl: './introduction-brainstorming.component.html',
  styleUrls: ['./introduction-brainstorming.component.scss'],
})
export class IntroductionBrainstormingComponent {
  constructor(
    private dialogRef: MatDialogRef<IntroductionBrainstormingComponent>,
    public languageService: LanguageService,
  ) {}

  onClose() {
    this.dialogRef.close();
  }
}
