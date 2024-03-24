import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { M3DialogData, M3DialogElementKind } from './m3-dialog-types';
import { Observable } from 'rxjs';
import { M3BasicDialogComponent } from '../../components/dialog/m3-basic-dialog/m3-basic-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class M3DialogBuilderService {
  constructor(private readonly matDialog: MatDialog) {}

  open<E>(dialogData: M3DialogData): Observable<E> {
    switch (dialogData.kind) {
      case M3DialogElementKind.Basic:
        return new Observable<E>((subscriber) => {
          const dialog = this.matDialog.open(M3BasicDialogComponent, {
            width: '800px',
            data: dialogData,
          });
          dialog.afterClosed().subscribe((result) => {
            subscriber.next(result);
          });
        });
      default:
        throw new Error('Not Implemented.');
    }
  }
}
