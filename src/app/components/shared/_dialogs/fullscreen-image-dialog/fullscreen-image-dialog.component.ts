import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-fullscreen-image-dialog',
  templateUrl: './fullscreen-image-dialog.component.html',
  styleUrls: ['./fullscreen-image-dialog.component.scss'],
  standalone: false,
})
export class FullscreenImageDialogComponent {
  @Input() src: string;
  @ViewChild('image')
  image: ElementRef<HTMLImageElement>;
  private currentX: number = 0;
  private currentY: number = 0;
  private currentScale: number = 1;
  private previousTouches: Touch[];

  constructor(
    private dialogRef: MatDialogRef<FullscreenImageDialogComponent>,
  ) {}

  touchStart(event: TouchEvent) {
    this.previousTouches = Array.from(event.touches);
  }

  touchMove(event: TouchEvent) {
    const newTouches = Array.from(event.touches);
    const diffArr: [Touch, Touch][] = [];
    for (const prevTouch of Array.from(this.previousTouches)) {
      const newTouch = newTouches.find(
        (touch) => touch.identifier === prevTouch.identifier,
      );
      if (newTouch) {
        diffArr.push([prevTouch, newTouch]);
      }
    }
    this.previousTouches = newTouches;
    if (diffArr.length < 1) {
      return;
    }
    const beforeX = diffArr[0][0].clientX;
    const beforeY = diffArr[0][0].clientY;
    const newX = diffArr[0][1].clientX;
    const newY = diffArr[0][1].clientY;
    if (diffArr.length === 1) {
      this.movePicture(newX - beforeX, newY - beforeY);
    } else {
      const [oldDist, newDist] = diffArr.reduce(
        (sum, elem) => {
          sum[0] += Math.sqrt(
            (elem[0].clientX - beforeX) ** 2 + (elem[0].clientY - beforeY) ** 2,
          );
          sum[1] += Math.sqrt(
            (elem[1].clientX - newX) ** 2 + (elem[1].clientY - newY) ** 2,
          );
          return sum;
        },
        [0, 0],
      );
      const min = Math.min(innerWidth, innerHeight);
      const v = (newDist - oldDist) / (min * diffArr.length - 1);
      this.scalePicture(v);
    }
  }

  touchEnd(event: TouchEvent) {
    this.previousTouches = Array.from(event.touches);
  }

  move(event: MouseEvent) {
    if (event.buttons === 1) {
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

  scalePicture(scale: number) {
    this.currentScale += scale * this.currentScale;
    this.currentScale = Math.max(0.01, Math.min(100, this.currentScale));
    this.image.nativeElement.style.setProperty(
      '--pos-scale',
      String(this.currentScale),
    );
  }

  reset() {
    this.currentScale = 1;
    this.image.nativeElement.style.setProperty(
      '--pos-scale',
      String(this.currentScale),
    );
    this.currentX = 0;
    this.currentY = 0;
    this.image.nativeElement.style.setProperty('--pos-x', this.currentX + 'px');
    this.image.nativeElement.style.setProperty('--pos-y', this.currentY + 'px');
  }

  private movePicture(dx: number, dy: number) {
    this.currentX += dx;
    this.currentY += dy;
    this.image.nativeElement.style.setProperty('--pos-x', this.currentX + 'px');
    this.image.nativeElement.style.setProperty('--pos-y', this.currentY + 'px');
  }
}
