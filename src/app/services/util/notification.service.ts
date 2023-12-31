import { Injectable } from '@angular/core';
import {
  MatSnackBar,
  MatSnackBarConfig,
  MatSnackBarRef,
  TextOnlySnackBar,
} from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  public snackRef: MatSnackBarRef<TextOnlySnackBar>;

  constructor(public snackBar: MatSnackBar) {}

  show(
    message: string,
    action?: string,
    config?: MatSnackBarConfig,
    panelClass?: string,
  ) {
    const defaultConfig: MatSnackBarConfig = {
      duration: action ? 7000 : 5000,
      panelClass: panelClass ? [panelClass] : ['snackbar'],
    };

    // Delegate the message and merge the (optionally) passed config with the default config
    this.snackRef = this.snackBar.open(
      message,
      action,
      Object.assign({}, defaultConfig, config),
    );
  }
}
