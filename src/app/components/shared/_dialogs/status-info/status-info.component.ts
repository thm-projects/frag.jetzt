import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { GlobalCountChanged } from 'app/models/global-count-changed';

@Component({
  selector: 'app-status-info',
  templateUrl: './status-info.component.html',
  styleUrls: ['./status-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusInfoComponent {
  protected status: GlobalCountChanged;
  protected readonly i18n = i18n;

  constructor(private changeDetector: ChangeDetectorRef) {}

  public static open(dialog: MatDialog, data: GlobalCountChanged) {
    const ref = dialog.open(StatusInfoComponent);
    ref.componentInstance.updateStatus(data);
    return ref;
  }

  updateStatus(status: GlobalCountChanged) {
    this.status = status;
    this.changeDetector.detectChanges();
  }
}
