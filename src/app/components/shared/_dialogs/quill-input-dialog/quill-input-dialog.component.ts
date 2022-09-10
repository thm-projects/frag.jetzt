import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { KatexOptions } from 'ngx-markdown';
import { QuillUtils } from '../../../../utils/quill-utils';

interface DialogData {
  type: string;
  meta: string;
  quill: any;
  selection: any;
  overrideAction?: (value: string, selection: any) => void;
}

@Component({
  selector: 'app-quill-input-dialog',
  templateUrl: './quill-input-dialog.component.html',
  styleUrls: ['./quill-input-dialog.component.scss']
})
export class QuillInputDialogComponent implements OnInit {

  value = '';
  katexOptions: KatexOptions = {
    throwOnError: false
  };

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private dialogRef: MatDialogRef<QuillInputDialogComponent>
  ) {
  }

  ngOnInit(): void {
    if (this.data?.type === 'formula') {
      this.value = this.data.meta || '\\sigma = \\sqrt{ \\frac{1}{N} \\sum_{i=1}^N (x_i -\\mu)^2}';
    } else {
      this.value = this.data.meta;
    }
  }

  getKatex(): string {
    return '$' + this.value + '$';
  }

  buildConfirmAction() {
    return () => {
      if (this.data.overrideAction) {
        this.data.overrideAction(this.value, this.data.selection);
        this.dialogRef.close();
        return;
      }
      switch (this.data.type) {
        case 'link':
          if (this.value) {
            const ops = [];
            const startIndex = this.data.selection.index;
            if (startIndex > 0) {
              ops.push({ retain: startIndex });
            }
            ops.push({
              retain: this.data.selection.length,
              attributes: { link: this.value },
            });
            this.data.quill.updateContents({ ops });
          }
          break;
        case 'video':
          const value = QuillUtils.getVideoUrl(this.value)[0];
          if (value) {
            this.data.quill.insertEmbed(this.data.selection.index, 'video', value, 'user');
          }
          break;
        default:
          if (this.value) {
            this.data.quill.insertEmbed(this.data.selection.index, this.data.type, this.value, 'user');
          }
          break;
      }
      this.dialogRef.close();
    };
  }

  buildCancelAction() {
    return () => this.dialogRef.close();
  }

}
