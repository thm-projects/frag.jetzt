import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material';

@Injectable()
export class NotificationService {
  private defaultConfig = {
    duration: 2000
  };

  constructor(private snackBar: MatSnackBar) {
  }

  show(message: string, config?: MatSnackBarConfig) {
    // Delegate the message and merge the (optionally) passed config with the default config
    this.snackBar.open(message, '', Object.assign({}, this.defaultConfig, config));
  }
}
