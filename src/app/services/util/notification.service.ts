import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material';

@Injectable()
export class NotificationService {
  private defaultConfig = {
    duration: 4000,
    panelClass: ['snackbar']
  };
  public snackRef: any;

  constructor(public snackBar: MatSnackBar) {
  }

  show(message: string, action?: string, config?: MatSnackBarConfig) {
    // Delegate the message and merge the (optionally) passed config with the default config
    this.snackRef = this.snackBar.open(message, action, Object.assign({}, this.defaultConfig, config));
  }
}
