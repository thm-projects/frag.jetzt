import { Component, OnInit, EventEmitter } from '@angular/core';
import { MatRadioChange, MatDialogRef } from '@angular/material';
import { CommentCreatorPageComponent } from '../../comment-creator-page/comment-creator-page.component';
import { CommentService } from '../../../../services/http/comment.service';
import { Comment } from '../../../../models/comment';

@Component({
  selector: 'app-comment-export',
  templateUrl: './comment-export.component.html',
  styleUrls: ['./comment-export.component.scss']
})
export class CommentExportComponent implements OnInit {
  change: EventEmitter<MatRadioChange>;
  currentButton: string;
  csvSelected: boolean;
  comments: Comment[];
  roomId: string;

  constructor(public dialogRef: MatDialogRef<CommentCreatorPageComponent>,
    private commentService: CommentService) { }

  ngOnInit() {
    this.currentButton = 'json';
    this.roomId = localStorage.getItem(`roomId`);
    this.getComments();
  }

  getComments(): void {
    this.commentService.getComments(this.roomId)
      .subscribe(comments => {
        this.comments = comments;
      });
  }

  onChange(change: MatRadioChange): string {
    const csv = document.getElementById('csvBlock');
    if (change.value === 'json') {
      csv.style.visibility = 'hidden';
      this.csvSelected = false;
    }
    if (change.value === 'csv') {
      csv.style.visibility = 'visible';
      this.csvSelected = true;
    }
    return this.currentButton = change.value;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  exportJson(date: string): void {
    const jsonComments = JSON.parse(JSON.stringify(this.comments));
    jsonComments.forEach(element => {
      delete element.id;
      delete element.roomId;
      delete element.creatorId;
      element.body = element.body.replace(/[\r\n]/g, ' ').replace(/ +/g, ' ');
    });
    const myBlob = new Blob([JSON.stringify(jsonComments, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const fileName = 'comments_' + date + '.json';
    link.setAttribute('download', fileName);
    link.href = window.URL.createObjectURL(myBlob);
    link.click();
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

  onExport(): void {
    const date = new Date();
    const dateString = date.getFullYear() + '_' + ('0' + (date.getMonth() + 1)).slice(-2) + '_' + ('0' + date.getDate()).slice(-2);
    const timeString = ('0' + date.getHours()).slice(-2) + ('0' + date.getMinutes()).slice(-2) + ('0' + date.getSeconds()).slice(-2);
    const timestamp = dateString + '_' + timeString;
    if (this.currentButton === 'json') {
      this.exportJson(timestamp);
      this.onNoClick();
    }
    if (this.csvSelected) {
      if (this.currentButton === 'comma') {
        this.exportCsv(',', timestamp);
        this.onNoClick();
      }
      if (this.currentButton === 'semicolon') {
        this.exportCsv(';', timestamp);
        this.onNoClick();
      } else {
        this.exportCsv(',', timestamp);
        this.onNoClick();
      }
    }
  }
}
