import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  QueryList,
  Renderer2,
  ViewChild,
  ViewChildren,
  ViewEncapsulation
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { DialogConfirmActionButtonType } from '../../dialog/dialog-action-buttons/dialog-action-buttons.component';
import { NgxQRCodeComponent } from 'ngx-qrcode2';

@Component({
  selector: 'app-qr-code-dialog',
  templateUrl: './qr-code-dialog.component.html',
  styleUrls: ['./qr-code-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class QrCodeDialogComponent implements OnInit, AfterViewInit {

  @ViewChild(NgxQRCodeComponent) code: NgxQRCodeComponent;
  @ViewChild('imageWrapper')imgWrp: ElementRef;

  private img: HTMLImageElement;
  private qrCode = '';

  confirmButtonType: DialogConfirmActionButtonType = DialogConfirmActionButtonType.Primary;

  constructor(
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<QrCodeDialogComponent>,
    private ref: ElementRef,
    private render: Renderer2
  ) { }

  ngOnInit() {
  }

  ngAfterViewInit() {
  }

  public setQRCode(url: string) {
    this.qrCode = url;
    this.code.value = url;
    this.code.createQRCode();
    this.code.toDataURL().then((a) => {
      this.createImage(a.toString());
    });
  }

  private createImage(base: string) {
    this.render.setStyle(this.imgWrp.nativeElement, 'background-image', 'url(' + base + ')');
  }

  public close() {
    this.dialog.closeAll();
  }
}
