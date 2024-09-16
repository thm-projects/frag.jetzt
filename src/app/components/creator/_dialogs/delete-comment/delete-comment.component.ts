import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import { Component, Inject, OnInit } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-delete-comment',
  templateUrl: './delete-comment.component.html',
  styleUrls: ['./delete-comment.component.scss'],
})
export class DeleteCommentComponent implements OnInit {
  protected readonly i18n = i18n;

  constructor(
    public dialogRef: MatDialogRef<DeleteCommentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: object,
    private liveAnnouncer: LiveAnnouncer,
  ) {}

  ngOnInit() {
    this.liveAnnouncer.announce(i18n().reallyDelete);
  }
}
