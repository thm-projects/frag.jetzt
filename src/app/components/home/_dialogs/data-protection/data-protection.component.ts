import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  DialogConfirmActionButtonType
} from '../../../shared/dialog/dialog-action-buttons/dialog-action-buttons.component';
import { MatDialogRef } from '@angular/material/dialog';
import { LanguageService } from '../../../../services/util/language.service';

@Component({
  selector: 'app-data-protection',
  templateUrl: './data-protection.component.html',
  styleUrls: ['./data-protection.component.scss']
})
export class DataProtectionComponent implements OnInit {

  confirmButtonType: DialogConfirmActionButtonType;

  constructor(
    private router: Router,
    private dialogRef: MatDialogRef<DataProtectionComponent>,
    public languageService: LanguageService,
  ) {
    this.confirmButtonType = DialogConfirmActionButtonType.Primary;
  }

  ngOnInit() {
  }

  buildDeclineActionCallback(): () => void {
    return () => this.dialogRef.close(false);
  }

  buildConfirmActionCallback(): () => void {
    return () => this.dialogRef.close(true);
  }
}
