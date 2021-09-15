import { Component, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../../services/util/language.service';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-explanation-dialog',
  templateUrl: './explanation-dialog.component.html',
  styleUrls: ['./explanation-dialog.component.scss']
})
export class ExplanationDialogComponent implements OnInit {

  @Input() translateKey: string;
  data: string;

  constructor(private translateService: TranslateService,
              private languageService: LanguageService,
              private dialogRef: MatDialogRef<ExplanationDialogComponent>) {
    languageService.langEmitter.subscribe(lang => {
      translateService.use(lang);
    });
  }

  ngOnInit(): void {
    this.translateService.use(localStorage.getItem('currentLang'));
    this.translateService.get(this.translateKey).subscribe(text => this.data = text);
  }

  buildConfirmAction() {
    return () => this.dialogRef.close();
  }

}
