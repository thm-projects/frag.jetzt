import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { LanguageService } from '../../../../services/util/language.service';

@Component({
  selector: 'app-gpt-prompt-explanation',
  templateUrl: './gpt-prompt-explanation.component.html',
  styleUrls: ['./gpt-prompt-explanation.component.scss'],
})
export class GptPromptExplanationComponent {
  constructor(
    private dialogRef: MatDialogRef<GptPromptExplanationComponent>,
    public languageService: LanguageService,
  ) {}

  onClose() {
    this.dialogRef.close();
  }
}
