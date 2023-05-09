import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { LanguageService } from 'app/services/util/language.service';

@Component({
  selector: 'app-ask-onboarding',
  templateUrl: './ask-onboarding.component.html',
  styleUrls: ['./ask-onboarding.component.scss'],
})
export class AskOnboardingComponent implements OnInit {
  public readonly onSubmit = this.submit.bind(this);
  public readonly onCancel = this.cancel.bind(this);

  constructor(
    public langService: LanguageService,
    private dialogRef: MatDialogRef<AskOnboardingComponent>,
  ) {}

  ngOnInit(): void {}

  private submit() {
    this.dialogRef.close(true);
  }

  private cancel() {
    this.dialogRef.close(false);
  }
}
