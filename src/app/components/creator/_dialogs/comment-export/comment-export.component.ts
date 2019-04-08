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
    private commentService: CommentService,
  ) { }

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

  onNoClick() {
    this.dialogRef.close();
  }

  exportJson() {
    let jsonComments = JSON.parse(JSON.stringify(this.comments));
    jsonComments.forEach(element => {
      delete element.id;
      delete element.roomId;
      delete element.creatorId;
    });
    const myBlob = new Blob([JSON.stringify(jsonComments, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.setAttribute('download', 'comments.json');
    link.href = window.URL.createObjectURL(myBlob);
    link.click();
  }

  exportCsv(delimiter: string) {
    let csv: string;
    let keyFields = '';
    let valueFields = '';
    keyFields = Object.keys(this.comments[0]).slice(3).join(delimiter) + '\r\n';
    this.comments.forEach(element => {
      element.body = '"' + element.body.replace(/[\r\n]/g, ' ').replace(/"/g, '""') + '"';
      valueFields += Object.values(element).slice(3).join(delimiter) + '\r\n';
    });
    csv = keyFields + valueFields;
    const myBlob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.setAttribute('download', 'comments.csv');
    link.href = window.URL.createObjectURL(myBlob);
    link.click();
  }

  onExport() {
    if (this.currentButton === 'json') {
      this.exportJson();
      this.onNoClick();
    }
    if (this.csvSelected) {
      if (this.currentButton === 'comma') {
        this.exportCsv(',');
        this.onNoClick();
      }
      if (this.currentButton === 'semicolon') {
        this.exportCsv(';');
        this.onNoClick();
      } else {
        this.exportCsv(',');
        this.onNoClick();
      }
    }
  }
}
