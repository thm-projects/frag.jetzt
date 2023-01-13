import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-fullscreen-image-dialog',
  templateUrl: './fullscreen-image-dialog.component.html',
  styleUrls: ['./fullscreen-image-dialog.component.scss'],
})
export class FullscreenImageDialogComponent implements OnInit {
  @Input() src: string;
  @ViewChild('image')
  image: ElementRef<HTMLImageElement>;
  private currentX: number = 0;
  private currentY: number = 0;
  private currentScale: number = 1;
  private touchX: number;
  private touchY: number;

  constructor(
    private dialogRef: MatDialogRef<FullscreenImageDialogComponent>,
  ) {}

  ngOnInit(): void {}

  touchStart(event: TouchEvent){
    
  }

  move(event: MouseEvent) {
    if(event.buttons === 1) {
      this.movePicture(event.movementX, event.movementY);
    }
  }

  wheelEvent(event: WheelEvent) {
    event.preventDefault();
    this.scalePicture(event.deltaY * 0.002);
  }

  onCloseClick(): void {
    this.dialogRef.close();
  }

  private scalePicture(scale: number){
    this.currentScale += scale * this.currentScale;
    this.currentScale = Math.max(0.01, Math.min(100, this.currentScale));
    this.image.nativeElement.style.setProperty('--pos-scale', String(this.currentScale));
  }

  private movePicture(dx: number, dy: number) {
    this.currentX += dx;
    this.currentY += dy;
    this.image.nativeElement.style.setProperty('--pos-x', this.currentX + 'px');
    this.image.nativeElement.style.setProperty('--pos-y', this.currentY + 'px');
  }
}
