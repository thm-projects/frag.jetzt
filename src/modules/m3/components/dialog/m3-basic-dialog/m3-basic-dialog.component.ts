import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import {
  M3BasicDialogData,
  M3DialogElementKind,
} from '../../../services/dialog/m3-dialog-types';
import { MatButton } from '@angular/material/button';
import { NgForOf, NgIf, NgSwitch, NgSwitchCase } from '@angular/common';
import { EssentialsModule } from '../../../../../app/components/essentials/essentials.module';

@Component({
  selector: 'app-m3-basic-dialog',
  imports: [
    MatDialogTitle,
    MatDialogActions,
    MatButton,
    NgForOf,
    NgIf,
    EssentialsModule,
    NgSwitch,
    NgSwitchCase,
  ],
  templateUrl: './m3-basic-dialog.component.html',
  styleUrl: './m3-basic-dialog.component.scss',
})
export class M3BasicDialogComponent {
  protected readonly M3DialogElementKind = M3DialogElementKind;
  constructor(
    public readonly matDialogRef: MatDialogRef<M3BasicDialogComponent>,
    public readonly translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public readonly dialogData: M3BasicDialogData,
  ) {}
}
