import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Room } from '../../../../models/room';
import { WorkerDialogComponent } from '../worker-dialog/worker-dialog.component';
import { LanguageService } from '../../../../services/util/language.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-worker-config-dialog',
  templateUrl: './worker-config-dialog.component.html',
  styleUrls: ['./worker-config-dialog.component.scss']
})
export class WorkerConfigDialogComponent implements OnInit {

  public selection = 'normal';

  constructor(private dialogRef: MatDialogRef<WorkerConfigDialogComponent>,
              protected langService: LanguageService,
              private translateService: TranslateService) {
    langService.langEmitter.subscribe(lang => translateService.use(lang));
  }

  public static addTask(dialog: MatDialog, room: Room) {
    dialog.open(WorkerConfigDialogComponent, {
      width: '900px',
      maxWidth: '100%'
    }).afterClosed().subscribe(data => {
      if (!data) {
        return;
      }
      WorkerDialogComponent.addWorkTask(dialog, room, data === 'only-failed');
    });
  }

  ngOnInit(): void {
    this.translateService.use(localStorage.getItem('currentLang'));
  }

  buildConfirmAction() {
    return () => {
      this.dialogRef.close(this.selection);
    };
  }

  buildCancelAction() {
    return () => this.dialogRef.close();
  }

}
