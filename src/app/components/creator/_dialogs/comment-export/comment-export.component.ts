import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { CommentCreatorPageComponent } from '../../comment-creator-page/comment-creator-page.component';
import { Comment } from '../../../../models/comment';

@Component({
  selector: 'app-comment-export',
  templateUrl: './comment-export.component.html',
  styleUrls: ['./comment-export.component.scss']
})
export class CommentExportComponent implements OnInit {
  comments: Comment[];
  exportType = 'comma';

  constructor(public dialogRef: MatDialogRef<CommentCreatorPageComponent>) { }

  ngOnInit() {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  exportCsv(delimiter: string, date: string): void {
    let csv: string;
    let keyFields = '';
    let valueFields = '';
    keyFields = Object.keys(this.comments[0]).slice(3).join(delimiter) + '\r\n';
    this.comments.forEach(element => {
      element.body = '"' + element.body.replace(/[\r\n]/g, ' ').replace(/ +/g, ' ').replace(/"/g, '""') + '"';
      valueFields += Object.values(element).slice(3).join(delimiter) + '\r\n';
    });
    csv = keyFields + valueFields;
    const myBlob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    const fileName = 'comments_' + date + '.csv';
    link.setAttribute('download', fileName);
    link.href = window.URL.createObjectURL(myBlob);
    link.click();
  }

  onExport(exportType: string): void {
    const date = new Date();
    const dateString = date.getFullYear() + '_' + ('0' + (date.getMonth() + 1)).slice(-2) + '_' + ('0' + date.getDate()).slice(-2);
    const timeString = ('0' + date.getHours()).slice(-2) + ('0' + date.getMinutes()).slice(-2) + ('0' + date.getSeconds()).slice(-2);
    const timestamp = dateString + '_' + timeString;
      if (exportType === 'comma') {
        this.exportCsv(',', timestamp);
        this.onNoClick();
      }
      if (exportType === 'semicolon') {
        this.exportCsv(';', timestamp);
        this.onNoClick();
      }
  }
}
