import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ImageViewerData {
  imageUrl: string;
  altText: string;
}

@Component({
  selector: 'app-image-viewer-modal',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="image-viewer-container" (click)="close()">
      <div class="image-viewer-header">
        <button mat-icon-button (click)="close(); $event.stopPropagation()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      <div class="image-viewer-content" (click)="$event.stopPropagation()">
        <img
          [src]="data.imageUrl"
          [alt]="data.altText"
          class="fullscreen-image"
        />
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
        background-color: rgba(0, 0, 0, 0.95);
        position: relative;
      }

      .image-viewer-header {
        display: flex;
        justify-content: flex-end;
        padding: 8px;
        position: absolute;
        top: 0;
        right: 0;
        z-index: 10;
      }

      .image-viewer-header button {
        background-color: rgba(0, 0, 0, 0.6);
        color: white;
      }

      .image-viewer-content {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        width: 100vw;
        height: 100vh;
      }

      .fullscreen-image {
        max-width: 98vw;
        max-height: 98vh;
        object-fit: contain;
        transition: transform 0.3s ease;
      }
    `,
  ],
})
export class ImageViewerModalComponent {
  constructor(
    public dialogRef: MatDialogRef<ImageViewerModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImageViewerData,
  ) {
    // Remove backdrop click closing to prevent accidental closes
    this.dialogRef.disableClose = true;

    // Make dialog fullscreen
    this.dialogRef.updateSize('100vw', '100vh');
  }

  close(): void {
    this.dialogRef.close();
  }
}
