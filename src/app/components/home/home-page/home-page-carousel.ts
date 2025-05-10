import { M3WindowSizeClass } from '../../../../modules/m3/components/navigation/m3-navigation-types';
import { LanguageKey } from './home-page-types';
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
  content: {
    title: {
      [A in LanguageKey]: string;
    };
    description: {
      [A in LanguageKey]: string;
    };
    // Add optional detailed description
    detailedDescription?: {
      [A in LanguageKey]: string;
    };
    image: {
      url?: string;
      alt?: string;
      svgIcon?: string;
    };
    // Add optional video property
    video?: {
      url: string;
      title: string;
      controls?: boolean;
      autoplay?: boolean;
      muted?: boolean;
    };
  };
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
  entries: [
    // First entry remains unchanged
    homePageCarouselEntries[0],

    // Small card (index 1) without video
    {
      window: homePageCarouselEntries[1].window,
      content: {
        ...homePageCarouselEntries[1].content,
      },
    },

    // Make sure large card (index 2) also has video
    {
      window: homePageCarouselEntries[2].window,
      content: {
        ...homePageCarouselEntries[2].content,
        video: {
          url: 'assets/feature-videos/Git-History_2025-01-01_to_2025-04-15.mp4', // Original video for card 2
          title: 'Git History Visualization',
          controls: true,
          autoplay: true,
          muted: true,
        },
      },
    },

    // Any remaining entries stay unchanged
    ...homePageCarouselEntries.slice(3),
  ],
};
