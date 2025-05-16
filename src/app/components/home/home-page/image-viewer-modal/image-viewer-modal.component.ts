import {
  Component,
  Inject,
  HostListener,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DragDropModule, CdkDragEnd } from '@angular/cdk/drag-drop';
import {
  trigger,
  transition,
  style,
  animate,
  state,
} from '@angular/animations';

export interface ImageViewerData {
  imageUrl: string;
  altText: string;
}

@Component({
  selector: 'app-image-viewer-modal',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, DragDropModule],
  template: `
    <div
      class="image-viewer-container"
      (click)="close()"
      [@fadeInOut]="animationState"
      (wheel)="handleZoom($event)"
      (touchstart)="handleTouchStart($event)"
      (touchmove)="handleTouchMove($event)"
      (touchend)="handleTouchEnd()"
    >
      <div class="image-viewer-header" (click)="$event.stopPropagation()">
        <button
          mat-icon-button
          (click)="handleZoomOutClick($event)"
          (touchstart)="handleTouchButtonStart($event)"
          (touchend)="handleZoomOutTouch($event)"
          [disabled]="zoomLevel <= minZoom"
          matTooltip="Zoom Out (-)"
        >
          <mat-icon>zoom_out</mat-icon>
        </button>
        <button
          mat-icon-button
          (click)="resetZoom(); $event.stopPropagation()"
          (touchstart)="handleTouchButtonStart($event)"
          (touchend)="handleResetZoomTouch($event)"
          [disabled]="zoomLevel === 1"
          matTooltip="Reset Zoom (R)"
        >
          <mat-icon>fit_screen</mat-icon>
        </button>
        <button
          mat-icon-button
          (click)="handleZoomInClick($event)"
          (touchstart)="handleTouchButtonStart($event)"
          (touchend)="handleZoomInTouch($event)"
          [disabled]="zoomLevel >= maxZoom"
          matTooltip="Zoom In (+)"
        >
          <mat-icon>zoom_in</mat-icon>
        </button>
        <button
          mat-icon-button
          (click)="close(); $event.stopPropagation()"
          (touchstart)="handleTouchButtonStart($event)"
          (touchend)="handleCloseTouch($event)"
          matTooltip="Close (Esc)"
        >
          <mat-icon>close</mat-icon>
        </button>
      </div>
      <div
        class="image-viewer-content"
        (click)="$event.stopPropagation()"
        (dblclick)="toggleZoom($event)"
      >
        <div
          cdkDrag
          class="image-drag-wrapper"
          [cdkDragDisabled]="zoomLevel <= 1"
          (cdkDragEnded)="onDragEnded($event)"
          [cdkDragFreeDragPosition]="dragPosition"
        >
          <img
            #imageElement
            [src]="data.imageUrl"
            [alt]="data.altText"
            class="fullscreen-image"
            [style.transform]="'scale(' + zoomLevel + ')'"
            [@zoomAnimation]="zoomLevel === 1 ? 'normal' : 'zoomed'"
            draggable="false"
          />
        </div>
      </div>
      <div class="zoom-indicator" *ngIf="zoomLevel !== 1">
        {{ (zoomLevel * 100).toFixed(0) }}%
      </div>
      <div class="keyboard-hint">
        Press <kbd>Esc</kbd> to close, <kbd>+</kbd>/<kbd>-</kbd> to zoom,
        <kbd>R</kbd> to reset
      </div>
    </div>
  `,
  styles: [
    `
      .image-viewer-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
        width: 100vw;
        overflow: hidden;
        background-color: var(
          --mat-sys-surface-container-high,
          rgba(0, 0, 0, 0.95)
        );
        position: relative;
        color: var(--mat-sys-on-surface, white);
      }

      .image-viewer-header {
        display: flex;
        justify-content: flex-end;
        padding: 8px;
        position: absolute;
        top: 0;
        right: 0;
        z-index: 10;
        gap: 8px;
      }

      .image-viewer-header button {
        background-color: var(
          --mat-sys-surface-container-highest,
          rgba(0, 0, 0, 0.6)
        );
        color: var(--mat-sys-on-surface, white);
        min-width: 48px; /* Larger touch target */
        min-height: 48px; /* Larger touch target */
      }

      .image-viewer-content {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        width: 100vw;
        height: 100vh;
        cursor: default; /* Changed from zoom-in as drag will handle cursor */
      }

      .image-viewer-content:active {
        cursor: grabbing; /* Or cdkDrag will provide its own active cursor */
      }

      .image-drag-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: grab;
      }

      .image-drag-wrapper.cdk-drag-dragging {
        cursor: grabbing;
      }

      .fullscreen-image {
        max-width: 98vw;
        max-height: 98vh;
        object-fit: contain;
        transition: transform 0.3s ease;
        user-select: none;
      }

      .zoom-indicator {
        position: absolute;
        bottom: 16px;
        left: 16px;
        background-color: var(
          --mat-sys-surface-container-highest,
          rgba(0, 0, 0, 0.6)
        );
        color: var(--mat-sys-on-surface, white);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 14px;
      }

      .keyboard-hint {
        position: absolute;
        bottom: 16px;
        right: 16px;
        background-color: var(
          --mat-sys-surface-container-highest,
          rgba(0, 0, 0, 0.6)
        );
        color: var(--mat-sys-on-surface, white);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 14px;
        opacity: 0.7;
      }

      kbd {
        background-color: var(
          --mat-sys-surface-variant,
          rgba(255, 255, 255, 0.2)
        );
        padding: 2px 5px;
        border-radius: 3px;
        margin: 0 2px;
        font-family: monospace;
        color: var(--mat-sys-on-surface-variant, white);
      }

      /* Extra contrast for dark themes */
      :host-context(.dark-theme) .image-viewer-container {
        background-color: rgba(0, 0, 0, 0.98);
      }

      :host-context(.dark-theme) .image-viewer-header button {
        background-color: rgba(30, 30, 30, 0.7);
      }

      :host-context(.dark-theme) .zoom-indicator,
      :host-context(.dark-theme) .keyboard-hint {
        background-color: rgba(30, 30, 30, 0.7);
      }
    `,
  ],
  animations: [
    trigger('fadeInOut', [
      state('void', style({ opacity: 0 })),
      state('enter', style({ opacity: 1 })),
      state('leave', style({ opacity: 0 })),
      transition('void => enter', animate('200ms ease-in')),
      transition('enter => leave', animate('200ms ease-out')),
    ]),
    trigger('zoomAnimation', [
      state('normal', style({ transform: 'scale(1)' })),
      state('zoomed', style({ transform: '*' })),
      transition('normal <=> zoomed', animate('250ms ease-out')),
    ]),
  ],
})
export class ImageViewerModalComponent implements AfterViewInit {
  @ViewChild('imageElement') imageElement!: ElementRef;

  animationState = 'enter';
  zoomLevel = 1;
  maxZoom = 3;
  minZoom = 0.5;
  zoomStep = 0.1;
  translateX = 0;
  translateY = 0;
  dragPosition = { x: 0, y: 0 };

  // Touch handling variables
  private lastTouchX = 0;
  private lastTouchY = 0;
  private touchStartX = 0;
  private touchStartY = 0;
  private initialDistance = 0;
  private initialZoom = 1;

  constructor(
    public dialogRef: MatDialogRef<ImageViewerModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImageViewerData,
    private readonly elementRef: ElementRef,
  ) {
    this.dialogRef.disableClose = true;
    this.dialogRef.updateSize('100vw', '100vh');

    // Apply a fade-in animation when opening
    this.animationState = 'enter';
    this.updateDragPositionFromTranslate();
  }

  ngAfterViewInit() {
    // Focus the container for keyboard shortcuts
    setTimeout(() => {
      this.elementRef.nativeElement.focus();
    }, 100);
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    switch (event.key) {
      case 'Escape':
        this.close();
        break;
      case '+':
      case '=': // Same key on most keyboards
        this.zoomIn();
        event.preventDefault();
        break;
      case '-':
        this.zoomOut();
        event.preventDefault();
        break;
      case 'r':
      case 'R':
        this.resetZoom();
        event.preventDefault();
        break;
      case ' ': // Spacebar
        this.toggleZoom(null);
        event.preventDefault();
        break;
    }
  }

  handleZoom(event: WheelEvent) {
    event.preventDefault();

    if (event.ctrlKey || event.metaKey) {
      // Zoom with mouse wheel when Ctrl/Cmd is pressed
      const delta = event.deltaY < 0 ? this.zoomStep : -this.zoomStep;
      this.adjustZoom(this.zoomLevel + delta, event.clientX, event.clientY);
    } else if (this.zoomLevel > 1) {
      // Pan the image when zoomed in (using mouse wheel)
      this.translateX -= event.deltaX / this.zoomLevel;
      this.translateY -= event.deltaY / this.zoomLevel;
      this.constrainTranslation();
      this.updateDragPositionFromTranslate();
    }
  }

  handleTouchStart(event: TouchEvent) {
    event.preventDefault();

    if (event.touches.length === 2) {
      // Two fingers for pinch zoom
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      this.initialDistance = Math.sqrt(dx * dx + dy * dy);
      this.initialZoom = this.zoomLevel;
    }
  }

  handleTouchMove(event: TouchEvent) {
    event.preventDefault();

    if (event.touches.length === 2) {
      // Calculate distance between two fingers for pinch zoom
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Calculate midpoint of two fingers
      const centerX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
      const centerY = (event.touches[0].clientY + event.touches[1].clientY) / 2;

      // Calculate new zoom level
      const scale = distance / this.initialDistance;
      const newZoom = Math.max(
        this.minZoom,
        Math.min(this.maxZoom, this.initialZoom * scale),
      );

      this.adjustZoom(newZoom, centerX, centerY);
    }
  }

  handleTouchEnd() {
    // Reset touch tracking variables
    this.initialDistance = 0;
    this.initialZoom = this.zoomLevel;
  }

  zoomIn() {
    if (this.zoomLevel < this.maxZoom) {
      this.adjustZoom(this.zoomLevel + this.zoomStep);
    }
  }

  zoomOut() {
    // Allow zooming out below the original size (for detailed viewing)
    const newZoom = Math.max(this.minZoom, this.zoomLevel - this.zoomStep);
    this.adjustZoom(newZoom);
  }

  resetZoom() {
    this.zoomLevel = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.updateDragPositionFromTranslate();
  }

  toggleZoom(event: MouseEvent | null) {
    if (this.zoomLevel > 1) {
      // If already zoomed in, reset to normal size
      this.resetZoom();
    } else {
      // Zoom in to 2x at the click position or center
      const clientX = event ? event.clientX : window.innerWidth / 2;
      const clientY = event ? event.clientY : window.innerHeight / 2;
      this.adjustZoom(2, clientX, clientY);
    }
  }

  adjustZoom(newZoom: number, clientX?: number, clientY?: number) {
    if (newZoom === this.zoomLevel) return;

    const containerRect = this.elementRef.nativeElement.getBoundingClientRect();

    // Use provided coordinates or center of container
    const zoomX =
      clientX !== undefined
        ? clientX - containerRect.left
        : containerRect.width / 2;
    const zoomY =
      clientY !== undefined
        ? clientY - containerRect.top
        : containerRect.height / 2;

    // Get current image position
    const imageRect = this.imageElement.nativeElement.getBoundingClientRect();

    // Calculate position of the zoom point relative to the image
    const relativeX = (zoomX - imageRect.left) / imageRect.width;
    const relativeY = (zoomY - imageRect.top) / imageRect.height;

    // Calculate how much the point will move due to zoom
    const prevZoom = this.zoomLevel;
    this.zoomLevel = Math.min(this.maxZoom, Math.max(this.minZoom, newZoom));

    // Adjust translation to keep the zoom point fixed
    if (prevZoom !== this.zoomLevel) {
      // Calculate translation adjustment to keep zoom point fixed
      const scaleFactor = this.zoomLevel / prevZoom;

      // When zooming back to 1, reset translation
      if (this.zoomLevel === 1) {
        this.translateX = 0;
        this.translateY = 0;
      } else {
        // Adjust translation based on zoom point
        const imageWidth = imageRect.width;
        const imageHeight = imageRect.height;

        this.translateX =
          this.translateX * scaleFactor +
          ((1 - scaleFactor) * (relativeX - 0.5) * imageWidth) / this.zoomLevel;

        this.translateY =
          this.translateY * scaleFactor +
          ((1 - scaleFactor) * (relativeY - 0.5) * imageHeight) /
            this.zoomLevel;
      }
    }

    this.constrainTranslation();
    this.updateDragPositionFromTranslate();
  }

  constrainTranslation() {
    // Get current image dimensions
    const imgElement = this.imageElement.nativeElement;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const imgWidth = imgElement.naturalWidth;
    const imgHeight = imgElement.naturalHeight;

    // Calculate visible dimensions after zoom
    const visibleWidth = imgWidth * this.zoomLevel;
    const visibleHeight = imgHeight * this.zoomLevel;

    // Calculate the maximum translation in each direction
    const maxTranslateX = (visibleWidth - viewportWidth) / (2 * this.zoomLevel);
    const maxTranslateY =
      (visibleHeight - viewportHeight) / (2 * this.zoomLevel);

    // Constrain translation to keep image within view
    if (visibleWidth > viewportWidth) {
      this.translateX = Math.max(
        -maxTranslateX,
        Math.min(maxTranslateX, this.translateX),
      );
    } else {
      this.translateX = 0;
    }

    if (visibleHeight > viewportHeight) {
      this.translateY = Math.max(
        -maxTranslateY,
        Math.min(maxTranslateY, this.translateY),
      );
    } else {
      this.translateY = 0;
    }
  }

  onDragEnded(event: CdkDragEnd): void {
    this.dragPosition = event.source.getFreeDragPosition();
    this.updateTranslateFromDragPosition();
    this.constrainTranslation();
    this.updateDragPositionFromTranslate();
  }

  private updateDragPositionFromTranslate(): void {
    this.dragPosition = {
      x: this.translateX * this.zoomLevel,
      y: this.translateY * this.zoomLevel,
    };
  }

  private updateTranslateFromDragPosition(): void {
    if (this.zoomLevel !== 0) {
      this.translateX = this.dragPosition.x / this.zoomLevel;
      this.translateY = this.dragPosition.y / this.zoomLevel;
    } else {
      this.translateX = 0;
      this.translateY = 0;
    }
  }

  close(): void {
    // Apply a fade-out animation before closing
    this.animationState = 'leave';

    // Wait for animation to complete before closing
    setTimeout(() => {
      this.dialogRef.close();
    }, 200);
  }

  handleZoomOutClick(event: MouseEvent) {
    // Immediately stop event propagation
    event.stopPropagation();
    event.preventDefault();

    // Check if we're already at minimum zoom (with tolerance for floating point errors)
    if (this.zoomLevel <= this.minZoom + 0.001) {
      return;
    }

    // Otherwise perform zoom out
    this.zoomOut();
  }

  handleZoomInClick(event: MouseEvent) {
    // Immediately stop event propagation
    event.stopPropagation();
    event.preventDefault();

    // Check if we're already at maximum zoom
    if (this.zoomLevel >= this.maxZoom - 0.001) {
      return;
    }

    // Otherwise perform zoom in
    this.zoomIn();
  }

  // Prevent default behavior for touch start
  handleTouchButtonStart(event: TouchEvent) {
    console.log('Touch button start');
    event.preventDefault();
    event.stopPropagation();

    // Add visual feedback
    const target = event.target as HTMLElement;
    const button = target.closest('button');
    if (button) {
      button.classList.add('touched');
    }
  }

  handleZoomOutTouch(event: TouchEvent) {
    console.log('Touch zoom out');
    event.preventDefault();
    event.stopPropagation();
    this.zoomOut();

    // Remove visual feedback
    this.removeTouchClass(event);
  }

  handleZoomInTouch(event: TouchEvent) {
    console.log('Touch zoom in');
    event.preventDefault();
    event.stopPropagation();
    this.zoomIn();

    // Remove visual feedback
    this.removeTouchClass(event);
  }

  handleResetZoomTouch(event: TouchEvent) {
    console.log('Touch reset zoom');
    event.preventDefault();
    event.stopPropagation();
    this.resetZoom();

    // Remove visual feedback
    this.removeTouchClass(event);
  }

  handleCloseTouch(event: TouchEvent) {
    console.log('Touch close');
    event.preventDefault();
    event.stopPropagation();
    this.close();

    // Remove visual feedback
    this.removeTouchClass(event);
  }

  private removeTouchClass(event: TouchEvent) {
    const target = event.target as HTMLElement;
    const button = target.closest('button');
    if (button) {
      button.classList.remove('touched');
    }
  }
}
