import { Component, Inject, OnInit } from '@angular/core';
import { NotificationService } from '../../../../services/util/notification.service';
import { UserService } from '../../../../services/http/user.service';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { EventService } from '../../../../services/util/event.service';

@Component({
  selector: 'app-user-activation',
  templateUrl: './user-activation.component.html',
  styleUrls: ['./user-activation.component.scss']
})
export class UserActivationComponent implements OnInit {

  activationKeyFormControl = new FormControl('', [Validators.required]);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public userService: UserService,
    public notificationService: NotificationService,
    public dialogRef: MatDialogRef<UserActivationComponent>,
    private translationService: TranslateService,
    public eventService: EventService) {
  }

  ngOnInit() {
  }

  login(activationKey: string): void {
    activationKey = activationKey.trim();

    this.userService.activate(this.data.name.trim(), activationKey).subscribe(
      ret => {
        this.dialogRef.close({ success: true });
      },
      err => {
        this.translationService.get('user-activation.activation-key-incorrect').subscribe(message => {
          this.notificationService.show(message);
        });
      }
    );
  }


  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildCloseDialogActionCallback(): () => void {
    return () => this.dialogRef.close();
  }

  resetActivation(): void {
    this.userService.resetActivation(this.data.name.trim()).subscribe(
      ret => {
        this.translationService.get('login.restart-account-activation-correct').subscribe(message => {
          this.notificationService.show(message);
        });
      }
    );
  }


  /**
   * Returns a lambda which executes the dialog dedicated action on call.
   */
  buildActivationActionCallback(activationKey: HTMLInputElement): () => void {
    return () => this.login(activationKey.value);
  }
}
