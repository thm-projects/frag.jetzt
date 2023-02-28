import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { GPTEncoder } from 'app/gpt-encoder/GPTEncoder';
import { GptService } from 'app/services/http/gpt.service';
import { GptEncoderService } from 'app/services/util/gpt-encoder.service';

@Component({
  selector: 'app-gptuser-description-dialog',
  templateUrl: './gptuser-description-dialog.component.html',
  styleUrls: ['./gptuser-description-dialog.component.scss'],
})
export class GPTUserDescriptionDialogComponent implements OnInit {
  @Input()
  roomId: string;
  isLoading = true;
  readonly maxLength = 100;
  descriptionFormControl = new FormControl('', [
    this.validateTokenLength.bind(this),
  ]);
  descriptionTokenLength: number = 0;
  private encoder: GPTEncoder;

  constructor(
    private gptService: GptService,
    private dialogRef: MatDialogRef<GPTUserDescriptionDialogComponent>,
    private gptEncoderService: GptEncoderService,
  ) {}

  public static open(dialog: MatDialog, roomId: string) {
    const ref = dialog.open(GPTUserDescriptionDialogComponent, {
      minWidth: '500px',
    });
    ref.componentInstance.roomId = roomId;
    return ref;
  }

  ngOnInit(): void {
    this.gptService.getUserDescription(this.roomId).subscribe((description) => {
      this.descriptionFormControl.setValue(description || '');
      this.isLoading = false;
    });
    this.gptEncoderService
      .getEncoderOnce()
      .subscribe((e) => (this.encoder = e));
  }

  buildConfirmAction() {
    if (this.isLoading) {
      return undefined;
    }
    return () => {
      if (!this.descriptionFormControl.valid) {
        return;
      }
      this.gptService
        .updateUserDescription(this.roomId, this.descriptionFormControl.value)
        .subscribe({
          complete: () => this.dialogRef.close(),
        });
    };
  }

  buildCancelAction() {
    return () => {
      this.dialogRef.close();
    };
  }

  validateTokenLength(c: FormControl) {
    this.descriptionTokenLength =
      this.encoder?.encode(c.value || '')?.length || 0;
    return this.descriptionTokenLength > this.maxLength
      ? {
          tokenLength: {
            valid: false,
          },
        }
      : null;
  }
}
