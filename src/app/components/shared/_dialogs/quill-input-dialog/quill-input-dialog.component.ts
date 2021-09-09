import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import Delta from 'quill-delta';
import { KatexOptions } from 'ngx-markdown';

interface DialogData {
  type: string;
  meta: string;
  quill: any;
  selection: any;
  overrideAction?: (value: string) => void;
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

  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData,
              private dialogRef: MatDialogRef<QuillInputDialogComponent>) {
  }

  private static getVideoUrl(url) {
    let match = url.match(/^(?:(https?):\/\/)?(?:(?:www|m)\.)?youtube\.com\/watch.*v=([a-zA-Z0-9_-]+)/) ||
      url.match(/^(?:(https?):\/\/)?(?:(?:www|m)\.)?youtu\.be\/([a-zA-Z0-9_-]+)/) ||
      url.match(/^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#&?]*).*/);
    if (match && match[2].length === 11) {
      return 'https://www.youtube-nocookie.com/embed/' + match[2] + '?showinfo=0';
    }
    match = url.match(/^(?:(https?):\/\/)?(?:www\.)?vimeo\.com\/(\d+)/);
    if (match) {
      return (match[1] || 'https') + '://player.vimeo.com/video/' + match[2] + '/';
    }
    return null;
  }

  ngOnInit(): void {
    this.value = this.data.meta || '';
  }

  getKatex(): string {
    return '$' + this.value + '$';
  }

  buildConfirmAction() {
    return () => {
      if (this.data.overrideAction) {
        this.data.overrideAction(this.value);
        this.dialogRef.close();
        return;
      }
      switch (this.data.type) {
        case 'link':
          if (this.value) {
            const delta = new Delta()
              .retain(this.data.selection.index)
              .retain(this.data.selection.length, { link: this.value });
            this.data.quill.updateContents(delta);
          }
          break;
        case 'video':
          const value = QuillInputDialogComponent.getVideoUrl(this.value) || this.value;
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
