import { Component, OnInit } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { LanguageService } from '../../../../../services/util/language.service';

@Component({
  selector: 'app-introduction-comment-list',
  templateUrl: './introduction-comment-list.component.html',
  styleUrls: ['./introduction-comment-list.component.scss'],
})
export class IntroductionCommentListComponent implements OnInit {
  constructor(
    private dialogRef: MatDialogRef<IntroductionCommentListComponent>,
    public languageService: LanguageService,
  ) {}

  ngOnInit(): void {}

  onClose() {
    this.dialogRef.close();
  }
}
