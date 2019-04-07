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
    this.currentButton = '1';
    this.roomId = localStorage.getItem(`roomId`);
    this.getComments();
  }

  getComments(): void {
    this.commentService.getComments(this.roomId)
      .subscribe(comments => {
        this.comments = comments
      });
  }

  onChange(change: MatRadioChange): string {
    var csv = document.getElementById("csvBlock");
    if (change.value == 'json') {
      csv.style.visibility = "hidden";
      this.csvSelected = false;
    }
    if (change.value == 'csv') {
      csv.style.visibility = "visible";
      this.csvSelected = true;
    }
    return this.currentButton = change.value;
  }

  onNoClick() {
    this.dialogRef.close();
  }

  exportJson() {
    var myBlob = new Blob([JSON.stringify(this.comments, null, 2)], { type: 'application/json' });
    var link = document.createElement('a');
    link.setAttribute('download', 'comments.json');
    link.href = window.URL.createObjectURL(myBlob);;
    link.click();
  }

  exportCsv(delimiter: string) {
    if (this.comments.length == 0) {
      return;
    }
    let csv: string;
    let keyFields = Object.keys(this.comments[0]).map(i => `"${i}"`).join(delimiter) + '\n';
    let valueFields = '';
    this.comments.forEach(element => {
      valueFields += Object.values(element).map(i => `"${i}"`).join(delimiter) + '\n';
    });
    csv = keyFields + valueFields;
    var myBlob = new Blob([csv], { type: 'text/csv' });
    var link = document.createElement('a');
    link.setAttribute('download', 'comments.csv');
    link.href = window.URL.createObjectURL(myBlob);;
    link.click();
  }

  onExport() {
    if (this.currentButton == 'json') {
      this.exportJson();
      this.onNoClick();
    }
    if (this.csvSelected) {
      if (this.currentButton == 'comma') {
        this.exportCsv(',');
        this.onNoClick();
      }
      if (this.currentButton == 'semicolon') {
        this.exportCsv(';');
        this.onNoClick();
      }
      else {
        this.exportCsv(',');
        this.onNoClick();
      }
    }
  }
}
