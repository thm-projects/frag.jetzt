import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material';

@Injectable()
export class NotificationService {
  public snackRef: any;

  constructor(public snackBar: MatSnackBar) {
  }

  show(message: string, action?: string, config?: MatSnackBarConfig) {
    const defaultConfig: MatSnackBarConfig = {
      duration: (action ? 25000 : 7000),
      panelClass: ['snackbar']
    };

    // Delegate the message and merge the (optionally) passed config with the default config
    this.snackRef = this.snackBar.open(message, action, Object.assign({}, defaultConfig, config));
  }
}
