import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ViewCommentDataComponent } from '../../view-comment-data/view-comment-data.component';

interface ResultValue {
  body: string;
  text: string;
}

@Component({
  selector: 'app-deep-ldialog',
  templateUrl: './deep-ldialog.component.html',
  styleUrls: ['./deep-ldialog.component.scss']
})
export class DeepLDialogComponent implements OnInit {

  radioButtonValue: ResultValue;
  normalValue: ResultValue;
  improvedValue: ResultValue;

  constructor(
    private dialogRef: MatDialogRef<DeepLDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit(): void {
    this.normalValue = {
      body: this.data.body,
      text: this.data.text
    };
    const sentences = this.data.improvedText.split('\n').filter(sent => sent.length > 0);
    const delta = ViewCommentDataComponent.getDeltaFromData(this.data.body);
    if (delta === null) {
      setTimeout(() => this.dialogRef.close(this.normalValue));
      return;
    }
    const ops = delta.ops;
    let i = 0;
    let sentenceIndex = 0;
    let lastFoundIndex = -1;
    for (; i < ops.length && sentenceIndex < sentences.length; i++) {
      const data = ops[i]['insert'];
      if (typeof data !== 'string') {
        continue;
      }
      if (data === '\n') {
        continue;
      }
      const endsNewline = data.endsWith('\n');
      const mod = (endsNewline ? -1 : 0) + (data.startsWith('\n') ? -1 : 0);
      const occurrence = data.split('\n').length + mod;
      ops[i]['insert'] = sentences.slice(sentenceIndex, sentenceIndex + occurrence).join('\n') +
        (endsNewline ? '\n' : '');
      sentenceIndex += occurrence;
      lastFoundIndex = i;
    }
    for (let j = ops.length - 1; j >= i; j--) {
      const data = ops[i]['insert'];
      if (data === 'string' && data.trim().length) {
        ops.splice(j, 1);
      }
    }
    if (sentenceIndex < sentences.length) {
      if (lastFoundIndex < 0) {
        setTimeout(() => this.dialogRef.close(this.normalValue));
        return;
      }
      let data = ops[i]['insert'];
      const endsNewline = data.endsWith('\n');
      if (endsNewline) {
        data = data.substring(0, data.length - 1);
      }
      ops[i]['insert'] = data + sentences.slice(sentenceIndex).join('\n') + (endsNewline ? '\n' : '');
    }
    this.improvedValue = {
      body: ViewCommentDataComponent.getDataFromDelta(delta),
      text: this.data.improvedText
    };
    this.radioButtonValue = this.normalValue;
  }

  buildCloseDialogActionCallback(): () => void {
    return () => this.dialogRef.close();
  }

  buildSubmitBodyActionCallback(): () => void {
    return () => this.dialogRef.close(this.radioButtonValue);
  }

}
