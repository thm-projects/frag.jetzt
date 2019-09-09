import { Component, OnInit, Input, Output } from '@angular/core';

/**
 * Available confirm button types.
 */
export enum DialogConfirmActionButtonType {
  Primary = 'primary',
  Alert = 'alert'
}


@Component({
  selector: 'app-dialog-action-buttons',
  templateUrl: './dialog-action-buttons.component.html',
  styleUrls: ['./dialog-action-buttons.component.scss']
})
export class DialogActionButtonsComponent implements OnInit {

  /**
   * The button labels section.
   */
  @Input() buttonsLabelSection: string;


  /**
   * The i18n label identifier of the confirm button.
   */
  @Input() confirmButtonLabel: string;


  /**
   * The confirm button type.
   */
  @Input() confirmButtonType: DialogConfirmActionButtonType = DialogConfirmActionButtonType.Primary;


  /**
   * A callback which will be executed if the confirm button was clicked.
   */
  @Input() confirmButtonClickAction: (Function | undefined);


  /**
   * A callback which will be executed if the cancel button was clicked.
   */
  @Input() cancelButtonClickAction: (Function | undefined);


  /**
   * TRUE if some spacing will be rendered above the action buttons.
   */
  @Input() spacing = true;


  /**
   * The ARIA identifier prefix.
   */
  private ariaPrefix: string = (new Date().getTime().toString());


  /**
   * @inheritDoc
   */
  ngOnInit() {
    // nothing special yet
  }


  /**
   * Performs the confirm button click action.
   */
  public performConfirmButtonClickAction(): void {
    if (this.confirmButtonClickAction !== undefined) {
      this.confirmButtonClickAction();
    }
  }


  /**
   * Performs the cancel button click action.
   */
  public performCancelButtonClickAction(): void {
    if (this.cancelButtonClickAction !== undefined) {
      this.cancelButtonClickAction();
    }
  }
}
