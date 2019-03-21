import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef} from '@angular/material';
import { TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-present-comment',
  templateUrl: './present-comment.component.html',
  styleUrls: ['./present-comment.component.scss']
})
export class PresentCommentComponent implements OnInit {
  public body: string;
  sliderValue = 0;

  constructor(
    public dialogRef: MatDialogRef<PresentCommentComponent>,
    private translateService: TranslateService,
    public dialog: MatDialog
  ) { }

  ngOnInit() {
    this.translateService.use(localStorage.getItem('currentLang'));
  }

  onCloseClick(): void {
    this.dialogRef.close('close');
  }

  private updateFontSize(): void {
     console.log(this.sliderValue);
     document.getElementById('comment').style.fontSize = this.sliderValue + 'em';
  }
}
