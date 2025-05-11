import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

/**
 * Component that embeds YouTube videos with responsive design
 * Shows full player on large cards and thumbnails on small cards
 */
@Component({
  selector: 'app-youtube-embed',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- For large cards: Normal iframe embed -->
    <div *ngIf="!smallCard" class="youtube-container">
      <iframe
        [src]="safeUrl"
        width="100%"
        height="100%"
        frameborder="0"
        allowfullscreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        (load)="onIframeLoad()"
      ></iframe>
    </div>

    <!-- For small cards: Thumbnail with play button -->
    <div *ngIf="smallCard" class="youtube-thumbnail" (click)="openInNewTab()">
      <img [src]="thumbnailUrl" alt="YouTube Video Thumbnail" />
      <div class="play-overlay">
        <div class="play-button">▶</div>
      </div>
    </div>
  `,
  styles: [
    `
      .youtube-container {
        position: relative;
        width: 100%;
        padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
        height: 0;
        overflow: hidden;
        background-color: #000;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }

      iframe {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 8px;
      }

      .youtube-thumbnail {
        position: relative;
        width: 100%;
        height: 130px;
        overflow: hidden;
        border-radius: 8px;
        cursor: pointer;
        background-color: #000;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        transition:
          transform 0.2s ease,
          box-shadow 0.2s ease;
      }

      .youtube-thumbnail:hover {
        transform: scale(1.02);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }

      .youtube-thumbnail img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: filter 0.2s ease;
      }

      .play-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(0, 0, 0, 0.3);
        transition: background-color 0.3s;
      }

      .youtube-thumbnail:hover .play-overlay {
        background-color: rgba(0, 0, 0, 0.5);
      }

      .youtube-thumbnail:hover img {
        filter: brightness(1.1);
      }

      .play-button {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background-color: rgba(255, 0, 0, 0.9);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        transform: scale(1);
        transition:
          transform 0.2s ease,
          background-color 0.2s ease;
      }

      .youtube-thumbnail:hover .play-button {
        transform: scale(1.05);
        background-color: #ff0000;
      }
    `,
  ],
})
export class YoutubeEmbedComponent implements OnInit {
  /** YouTube video ID */
  @Input() videoId!: string;

  /** Start time in seconds */
  @Input() startAt = 0;

  /** Whether this component is on a small card */
  @Input() smallCard = false;

  /** Emits when the iframe has loaded */
  @Output() loaded = new EventEmitter<void>();

  /** Safe URL for iframe src */
  safeUrl!: SafeResourceUrl;

  /** URL for video thumbnail */
  thumbnailUrl!: string;

  constructor(private readonly sanitizer: DomSanitizer) {}

  /**
   * Initialize the component
   */
  ngOnInit(): void {
    this.updateSafeUrl();
    this.thumbnailUrl = `https://img.youtube.com/vi/${this.videoId}/hqdefault.jpg`;
  }

  /**
   * Handle iframe load event
   */
  onIframeLoad(): void {
    this.loaded.emit();
  }

  /**
   * Update the iframe src URL with proper security handling
   */
  private updateSafeUrl(): void {
    const url = `https://www.youtube.com/embed/${this.videoId}?rel=0&modestbranding=1`;
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  /**
   * Open the YouTube video in a new tab
   * Used for small cards where we show a thumbnail
   */
  openInNewTab(): void {
    const startTime = this.startAt ? `&t=${this.startAt}` : '';
    window.open(
      `https://www.youtube.com/watch?v=${this.videoId}${startTime}`,
      '_blank',
    );
  }
}
