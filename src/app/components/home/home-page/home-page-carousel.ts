import { M3WindowSizeClass } from '../../../../modules/m3/components/navigation/m3-navigation-types';
import { homePageCarouselEntries } from './carousel-entries/home-page-carousel-entries';

// Definiere TranslatedText
export type LanguageKey = 'de' | 'en' | 'fr';
export type TranslatedText = Record<LanguageKey, string>;

export interface HomePageCarousel {
  defaultEntryWindow: {
    /**
     * @see mat-grid-list
     */
    colspan: number;
    rowspan: number;
  };
  window: {
    [A in M3WindowSizeClass]: {
      /**
       * @see mat-grid-list
       */
      cols: number;
      rowHeight: number;
    };
  };
  entries: HomePageCarouselEntry[];
}

export interface HomePageCarouselEntry {
  window: Partial<{
    [A in M3WindowSizeClass]: {
      /**
       * @see mat-grid-list
       */
      colspan: number;
      rowspan: number;
    };
  }>;
  content: HomePageCarouselEntryContent;
}

export interface HomePageCarouselEntryContent {
  title: TranslatedText;
  description: TranslatedText;
  image?: { url: string } | { svgIcon: string };
  screenshotText?: {
    screenshot: {
      url: string;
      alt: TranslatedText;
    };
    text: TranslatedText;
  };
  youtube?: {
    videoId: string;
    title: string;
    startAt: number;
    summary?: TranslatedText;
  };
  // Hinzufügen des video-Properties, das in der Komponente verwendet wird
  video?: Video;
  detailedText?: {
    headline?: TranslatedText;
    content: TranslatedText;
    formatting?: 'plain' | 'html' | 'markdown';
  };
}

export interface Video {
  url: string;
  title?: string; // Add title property to match YouTubeContent
  subtitlesUrl?: string; // URL to WebVTT subtitle file
  descriptionsUrl?: string; // URL to WebVTT audio descriptions file
  poster?: string;
}

interface YouTubeContent {
  videoId: string;
  title?: string;
  startAt?: number;
  summary?: TranslatedText; // Geändert zu TranslatedText
}

export const carousel: HomePageCarousel = {
  window: {
    /**
     * unreachable
     */
    [M3WindowSizeClass.Compact]: {
      cols: 1,
      rowHeight: 0,
    },
    /**
     * unreachable
     */
    [M3WindowSizeClass.Medium]: {
      cols: 2,
      rowHeight: 0,
    },
    [M3WindowSizeClass.Expanded]: {
      cols: 1,
      rowHeight: 400,
    },
    [M3WindowSizeClass.Large]: {
      cols: 2,
      rowHeight: 400,
    },
    [M3WindowSizeClass.ExtraLarge]: {
      cols: 4,
      rowHeight: 400,
    },
    [M3WindowSizeClass.UltraLarge]: {
      cols: 6,
      rowHeight: 400,
    },
  },
  defaultEntryWindow: {
    colspan: 1,
    rowspan: 1,
  },
  // Alle Einträge direkt aus homePageCarouselEntries übernehmen.
  entries: homePageCarouselEntries.map((originalEntry) => ({
    window: originalEntry.window,
    content: originalEntry.content,
  })),
};
