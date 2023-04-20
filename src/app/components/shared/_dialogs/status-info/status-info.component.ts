import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { GlobalCountChanged } from 'app/models/global-count-changed';

@Component({
  selector: 'app-status-info',
  templateUrl: './status-info.component.html',
  styleUrls: ['./status-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusInfoComponent implements OnInit {
  protected status: GlobalCountChanged;
  protected readonly onConfirm = this.confirm.bind(this);

  constructor(
    private dialogRef: MatDialogRef<StatusInfoComponent>,
    private changeDetector: ChangeDetectorRef,
  ) {}

  public static open(dialog: MatDialog, data: GlobalCountChanged) {
    const ref = dialog.open(StatusInfoComponent);
    ref.componentInstance.updateStatus(data);
    return ref;
  }

  ngOnInit(): void {}

  updateStatus(status: GlobalCountChanged) {
    this.status = status;
    this.changeDetector.detectChanges();
  }

  private confirm() {
    this.dialogRef.close();
  }
}
