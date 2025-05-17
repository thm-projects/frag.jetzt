import { M3WindowSizeClass } from '../../../../modules/m3/components/navigation/m3-navigation-types';
import { homePageCarouselEntries } from './carousel-entries/home-page-carousel-entries';

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
  title: Record<string, string>;
  description: Record<string, string>;
  image?: {
    url?: string;
    alt?: string;
    svgIcon?: string;
  };
  video?: Video;
  youtube?: YouTubeContent;

  // New property for screenshot with scrollable text
  screenshotText?: {
    screenshot: {
      url: string;
      alt: {
        en: string;
        de: string;
        fr: string;
      };
    };
    text: {
      en: string;
      de: string;
      fr: string;
    };
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
  summary?: Record<string, string>; // or { en: string; de: string; fr: string; }
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
  // Die Struktur von HomePageCarouselEntry wird beibehalten,
  // aber der Inhalt (content) wird 1:1 aus homePageCarouselEntries übernommen.
  entries: homePageCarouselEntries.map((originalEntry) => ({
    window: originalEntry.window, // Behält die Fensterkonfiguration aus homePageCarouselEntries
    content: originalEntry.content, // Übernimmt das gesamte content-Objekt, inklusive youtube,
    // direkt aus homePageCarouselEntries.
  })),
};
