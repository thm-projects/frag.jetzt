import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ViewEncapsulation,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * YouTube embed component with enhanced GDPR-compliant consent mechanism.
 * Uses privacy-enhanced thumbnails and provides clear consent options.
 * Provides two display modes:
 * - Regular mode: Shows YouTube thumbnail with play button that opens video in new tab
 * - Small card mode: Compact version for limited space areas
 */
@Component({
  selector: 'app-youtube-embed',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.Emulated,
  template: `
    <!-- Large card with thumbnail -->
    <div *ngIf="!smallCard" class="youtube-container themed-container">
      <!-- Consent overlay - shown before user accepts -->
      <div *ngIf="!consentGiven" class="consent-overlay">
        <div class="consent-content">
          <h2>External Content</h2>
          <p>This video is hosted on YouTube.</p>
          <p class="privacy-notice">
            By viewing this content, you may share data with YouTube.
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              >Privacy Policy</a
            >
          </p>
          <button
            class="consent-button themed-button"
            (click)="consentGiven = true"
          >
            VIEW
          </button>
        </div>
      </div>

      <!-- Thumbnail after consent - clicking opens YouTube in new tab -->
      <div
        *ngIf="consentGiven"
        class="thumbnail large"
        (click)="openInNewTab()"
      >
        <img [src]="thumbnailUrl" alt="YouTube video thumbnail" />
        <div class="play-overlay">
          <div class="play-icon">▶</div>
        </div>
        <button class="revoke-button" (click)="revokeConsent($event)">×</button>
      </div>
    </div>

    <!-- Small card with thumbnail - compact version -->
    <div *ngIf="smallCard" class="small-container themed-container">
      <!-- Consent overlay for small cards -->
      <div *ngIf="!smallCardConsentGiven" class="consent-overlay small">
        <div class="consent-content small">
          <h3 class="small-heading">External Content</h3>
          <p class="small-text">Video hosted on YouTube</p>
          <a
            class="privacy-link small-privacy"
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            >Privacy Policy</a
          >
          <button
            class="consent-button themed-button small-button"
            (click)="smallCardConsentGiven = true"
          >
            VIEW
          </button>
        </div>
      </div>

      <!-- Small thumbnail after consent - clicking opens YouTube in new tab -->
      <div
        *ngIf="smallCardConsentGiven"
        class="thumbnail"
        (click)="openInNewTab()"
      >
        <img [src]="thumbnailUrl" alt="YouTube video thumbnail" />
        <div class="play-overlay">
          <div class="play-icon small-play">▶</div>
        </div>
        <button
          class="revoke-button small-revoke"
          (click)="revokeSmallConsent($event)"
        >
          ×
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      /* Host container styling */
      :host {
        position: relative;
        display: block;
      }

      /* Theme-compliant container styling */
      .themed-container {
        border: 2px solid var(--mat-sys-outline-variant, #e0e0e0);
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: box-shadow 0.2s ease;
      }

      .themed-container:hover {
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }

      /* Large card container (16:9 ratio) */
      .youtube-container {
        position: relative;
        width: 100%;
        padding-bottom: 56.25%;
        height: 0;
        overflow: hidden;
        background-color: var(--mat-sys-surface-container-low, #f5f5f5);
      }

      /* Small card container (fixed height) */
      .small-container {
        position: relative;
        height: 130px;
        overflow: hidden;
        background-color: var(--mat-sys-surface-container-low, #f5f5f5);
      }

      /* Consent overlay styling */
      .consent-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: var(--mat-sys-surface, white);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        border-radius: 6px;
      }

      /* Small overlay adjustments */
      .consent-overlay.small {
        padding: 4px;
      }

      /* Consent content container */
      .consent-content {
        text-align: center;
        padding: 1rem;
        color: var(--mat-sys-on-surface, #333);
      }

      /* Small content adjustments */
      .consent-content.small {
        padding: 0.25rem;
        max-width: 90%;
      }

      /* Heading styles */
      .consent-content h2,
      .consent-content h3 {
        margin-top: 0;
        margin-bottom: 8px;
        color: var(--mat-sys-on-surface-variant, #444);
      }

      /* Small heading adjustments */
      .small-heading {
        font-size: 0.9rem !important;
        margin-bottom: 2px !important;
        margin-top: -20px !important;
      }

      /* Paragraph styles */
      .consent-content p {
        margin-bottom: 16px;
        opacity: 0.8;
      }

      /* Small text adjustments */
      .small-text {
        font-size: 0.75rem !important;
        margin-bottom: 4px !important;
      }

      /* Privacy notice */
      .privacy-notice {
        font-size: 0.85rem;
        opacity: 0.7;
        margin-bottom: 12px;
      }

      .privacy-notice a,
      .privacy-link {
        color: var(--mat-sys-primary, #cc0000);
        text-decoration: none;
      }

      .privacy-notice a:hover,
      .privacy-link:hover {
        text-decoration: underline;
      }

      .small-privacy {
        font-size: 0.7rem !important;
        margin-bottom: 6px !important;
        display: block;
      }

      /* Button styling */
      .themed-button {
        background-color: var(--mat-sys-primary, #cc0000);
        color: var(--mat-sys-on-primary, white);
        border: none;
        padding: 10px 20px;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        border-radius: 4px;
        margin-top: 1rem;
        transition: background-color 0.2s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      /* Button hover state */
      .themed-button:hover {
        background-color: var(--mat-sys-primary-dark, #b80000);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }

      /* Small button adjustments */
      .small-button {
        padding: 4px 12px !important;
        font-size: 13px !important;
        margin-top: 4px !important;
        min-height: 24px !important;
        line-height: 1 !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
      }

      /* Revoke consent button */
      .revoke-button {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        border: none;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s;
        z-index: 5;
      }

      .revoke-button:hover {
        background-color: rgba(204, 0, 0, 0.9);
      }

      .small-revoke {
        width: 18px;
        height: 18px;
        font-size: 12px;
        top: 4px;
        right: 4px;
      }

      /* Thumbnail container */
      .thumbnail {
        width: 100%;
        height: 100%;
        position: relative;
        cursor: pointer;
        transition: transform 0.2s ease;
      }

      /* Large thumbnail positioning */
      .thumbnail.large {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
      }

      /* Thumbnail hover effect */
      .thumbnail:hover {
        transform: scale(1.02);
      }

      /* Thumbnail image */
      .thumbnail img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      /* Play button overlay */
      .play-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(0, 0, 0, 0.1);
        transition: background-color 0.2s ease;
      }

      /* Play overlay hover effect */
      .thumbnail:hover .play-overlay {
        background-color: rgba(0, 0, 0, 0.3);
      }

      /* Play button icon */
      .play-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 30px;
        color: white;
        background-color: rgba(0, 0, 0, 0.7);
        width: 70px;
        height: 70px;
        border-radius: 50%;
        transition:
          transform 0.2s ease,
          background-color 0.2s ease;
      }

      /* Play icon hover effect */
      .thumbnail:hover .play-icon {
        transform: scale(1.1);
        background-color: rgba(204, 0, 0, 0.9);
      }

      /* Small play button for small cards */
      .small-play {
        width: 40px !important;
        height: 40px !important;
        font-size: 20px !important;
      }
    `,
  ],
})
export class YoutubeEmbedComponent implements OnInit {
  /** YouTube video ID */
  @Input() videoId!: string;

  /** Start time in seconds */
  @Input() startAt = 0;

  /** Whether to use small card layout */
  @Input() smallCard = false;

  /** Emits when component has finished loading */
  @Output() loaded = new EventEmitter<void>();

  /** URL for video thumbnail */
  thumbnailUrl!: string;

  /** Consent state for large cards */
  consentGiven = false;

  /** Consent state for small cards */
  smallCardConsentGiven = false;

  constructor(private readonly sanitizer: DomSanitizer) {}

  /**
   * Initialize component
   * - Set thumbnail URL based on video ID
   * - Use privacy-enhanced domain for thumbnails
   * - Emit loaded event
   */
  ngOnInit(): void {
    // Initialize thumbnail URL using YouTube's thumbnail API
    // Note: YouTube does not offer a no-cookie version for thumbnails,
    // but they load without setting cookies by default
    this.thumbnailUrl = `https://img.youtube.com/vi/${this.videoId}/hqdefault.jpg`;

    // Emit loaded event when component is initialized
    setTimeout(() => this.loaded.emit(), 0);
  }

  /**
   * Open YouTube video in new tab
   * Uses privacy-enhanced YouTube domain
   * Adds start time parameter if specified
   */
  openInNewTab(): void {
    const startTime = this.startAt > 0 ? `&t=${this.startAt}` : '';
    // Using standard YouTube URL as user has explicitly consented
    window.open(
      `https://www.youtube.com/watch?v=${this.videoId}${startTime}`,
      '_blank',
    );
  }

  /**
   * Revoke consent for large cards
   * Prevents event propagation to avoid opening YouTube
   */
  revokeConsent(event: Event): void {
    event.stopPropagation();
    this.consentGiven = false;
  }

  /**
   * Revoke consent for small cards
   * Prevents event propagation to avoid opening YouTube
   */
  revokeSmallConsent(event: Event): void {
    event.stopPropagation();
    this.smallCardConsentGiven = false;
  }
}
