import { Component, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-explanation-dialog',
  templateUrl: './explanation-dialog.component.html',
  styleUrls: ['./explanation-dialog.component.scss'],
  standalone: false,
})
export class ExplanationDialogComponent implements OnInit {
  @Input() translateKey: string;
  data: string;

  constructor(private translateService: TranslateService) {}

  ngOnInit(): void {
    this.translateService
      .get(this.translateKey)
      .subscribe((text) => (this.data = text));
  }
}
