import { homePageCarouselEntries } from './home-page-carousel-entries';
import { M3WindowSizeClass } from '../../../../../modules/m3/components/navigation/m3-navigation-types';

describe('HomePageCarouselEntries', () => {
  // Basic structure tests
  it('should export an array of carousel entries', () => {
    expect(Array.isArray(homePageCarouselEntries)).toBe(true);
    expect(homePageCarouselEntries.length).toBeGreaterThan(0);
  });

  it('should have correct structure for all entries', () => {
    homePageCarouselEntries.forEach((entry) => {
      // Check main structure
      expect(entry.content).toBeDefined();
      expect(entry.window).toBeDefined();

      // Check content structure
      expect(entry.content.title).toBeDefined();
      expect(entry.content.description).toBeDefined();
      expect(entry.content.image).toBeDefined();

      // Check multilingual content - using bracket notation for index signatures
      expect(entry.content.title['en']).toBeDefined();
      expect(entry.content.title['de']).toBeDefined();
      expect(entry.content.title['fr']).toBeDefined();

      expect(entry.content.description['en']).toBeDefined();
      expect(entry.content.description['de']).toBeDefined();
      expect(entry.content.description['fr']).toBeDefined();
    });
  });

  // Window configuration tests
  it('should have valid window configurations for all size classes', () => {
    const sizeClasses = [
      M3WindowSizeClass.Expanded,
      M3WindowSizeClass.Large,
      M3WindowSizeClass.ExtraLarge,
      M3WindowSizeClass.UltraLarge,
    ];

    homePageCarouselEntries.forEach((entry) => {
      sizeClasses.forEach((sizeClass) => {
        expect(entry.window[sizeClass]).toBeDefined();
        expect(entry.window[sizeClass].colspan).toBeDefined();
        expect(entry.window[sizeClass].rowspan).toBeDefined();

        expect(entry.window[sizeClass].colspan).toBeGreaterThan(0);
        expect(entry.window[sizeClass].rowspan).toBeGreaterThan(0);
      });
    });
  });

  // 1x1 window size tests
  it('should have some entries using 1x1 sizing consistently', () => {
    // Find entries that use consistent 1x1 sizing across their defined window sizes
    const entriesUsing1x1 = homePageCarouselEntries.filter((entry) => {
      // Get all size classes defined for this entry
      const definedSizeClasses = Object.keys(entry.window);

      // Check if all defined size classes use 1x1 sizing
      return (
        definedSizeClasses.length > 0 &&
        definedSizeClasses.every((sizeClass) => {
          const config = entry.window[sizeClass];
          return config && config.colspan === 1 && config.rowspan === 1;
        })
      );
    });

    // There should be at least one entry using consistent 1x1 layout
    expect(entriesUsing1x1.length).toBeGreaterThan(0);
  });

  it('should have entries using consistent window sizing patterns', () => {
    // Look for window patterns that appear in multiple entries
    // This indicates reuse of window sizing constants like _1x1windowSize
    const windowPatterns: Record<string, number[]> = {};

    homePageCarouselEntries.forEach((entry, index) => {
      // Create a signature of the window configuration
      const signature = JSON.stringify(entry.window);

      if (!windowPatterns[signature]) {
        windowPatterns[signature] = [];
      }
      windowPatterns[signature].push(index);
    });

    // Find patterns used by multiple entries (suggesting a shared constant)
    const reusedPatterns = Object.values(windowPatterns).filter(
      (indices) => indices.length > 1,
    );

    // There should be at least one window pattern used by multiple entries
    expect(reusedPatterns.length).toBeGreaterThan(0);
  });

  // Content validation tests
  it('should have non-empty content in all languages', () => {
    homePageCarouselEntries.forEach((entry) => {
      ['en', 'de', 'fr'].forEach((lang) => {
        expect(entry.content.title[lang].length).toBeGreaterThan(0);
        expect(entry.content.description[lang].length).toBeGreaterThan(0);
      });
    });
  });

  it('should have valid image configurations', () => {
    homePageCarouselEntries.forEach((entry) => {
      const image = entry.content.image;

      // Each image should have either a url or svgIcon property
      expect(
        ('url' in image && typeof image.url === 'string') ||
          ('svgIcon' in image && typeof image.svgIcon === 'string'),
      ).toBe(true);

      // If it has a URL, it should point to the assets directory
      if ('url' in image) {
        expect(image.url.startsWith('/assets/')).toBe(true);
      }
    });
  });

  // YouTube content tests
  it('should have valid YouTube data when present', () => {
    const entriesWithYouTube = homePageCarouselEntries.filter(
      (entry) => 'youtube' in entry.content,
    );

    entriesWithYouTube.forEach((entry) => {
      const youtube = entry.content.youtube;

      expect(youtube.videoId).toBeDefined();
      expect(youtube.title).toBeDefined();
      expect(typeof youtube.videoId).toBe('string');
      expect(youtube.videoId.length).toBeGreaterThan(0);

      // If it has a startAt property, it should be a non-negative number
      if ('startAt' in youtube) {
        expect(typeof youtube.startAt).toBe('number');
        expect(youtube.startAt).toBeGreaterThanOrEqual(0);
      }

      // If it has a summary, check multilingual content
      if ('summary' in youtube) {
        expect(youtube.summary['en']).toBeDefined();
        expect(youtube.summary['de']).toBeDefined();
        expect(youtube.summary['fr']).toBeDefined();

        ['en', 'de', 'fr'].forEach((lang) => {
          expect(youtube.summary[lang].length).toBeGreaterThan(0);
        });
      }
    });
  });

  // UI layout tests
  it('should have at least one entry with expanded layout for larger screens', () => {
    const hasExpandedLayout = homePageCarouselEntries.some((entry) => {
      const xl = entry.window[M3WindowSizeClass.ExtraLarge];
      const ul = entry.window[M3WindowSizeClass.UltraLarge];

      return (
        xl.colspan > 1 || xl.rowspan > 1 || ul.colspan > 1 || ul.rowspan > 1
      );
    });

    expect(hasExpandedLayout).toBe(true);
  });

  // Content quality tests
  it('should have appropriate description lengths', () => {
    homePageCarouselEntries.forEach((entry) => {
      ['en', 'de', 'fr'].forEach((lang) => {
        const description = entry.content.description[lang];

        // Descriptions should be substantial enough but not excessive
        expect(description.length).toBeGreaterThan(20);
        // Maximum reasonable length for a card description
        expect(description.length).toBeLessThan(700);
      });
    });
  });

  it('should have balanced quotation marks in text content', () => {
    homePageCarouselEntries.forEach((entry) => {
      ['en', 'de', 'fr'].forEach((lang) => {
        const description = entry.content.description[lang];

        // Count standard quotation marks
        const doubleQuotes = (description.match(/"/g) || []).length;
        // There should be an even number (pairs of opening/closing quotes)
        expect(doubleQuotes % 2).toBe(0);

        // Check for German/French style quotes (» and «)
        const openingGuillemets = (description.match(/»/g) || []).length;
        const closingGuillemets = (description.match(/«/g) || []).length;
        expect(openingGuillemets).toBe(closingGuillemets);
      });
    });
  });
});
