import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { LanguageService } from '../../../../../services/util/language.service';

@Component({
  selector: 'app-introduction-comment-list',
  templateUrl: './introduction-comment-list.component.html',
  styleUrls: ['./introduction-comment-list.component.scss']
})
export class IntroductionCommentListComponent implements OnInit {

  constructor(
    private dialogRef: MatDialogRef<IntroductionCommentListComponent>,
    public languageService: LanguageService,
  ) {
  }

  ngOnInit(): void {
  }

  onClose() {
    this.dialogRef.close();
  }

}
