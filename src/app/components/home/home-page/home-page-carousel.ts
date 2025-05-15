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
  entries: [
    // First entry (index 0) - Neural Networks intro
    {
      window: homePageCarouselEntries[0].window,
      content: {
        ...homePageCarouselEntries[0].content,
        youtube: {
          videoId: 'aircAruvnKk', // 3Blue1Brown: Neural Networks
          title: 'Neural Networks Fundamentals',
          startAt: 60,
          summary: {
            en: 'This visual explanation from 3Blue1Brown introduces neural networks from first principles. Using intuitive animations, Grant Sanderson breaks down how neural networks learn and process information, making this complex topic accessible for students and engineers alike.',
          },
        },
      },
    },

    // Second entry (index 1) - Backpropagation
    {
      window: homePageCarouselEntries[1].window,
      content: {
        ...homePageCarouselEntries[1].content,
        youtube: {
          videoId: 'Ilg3gGewQ5U', // 3Blue1Brown: Backpropagation
          title: 'Backpropagation Algorithm',
          startAt: 30,
          summary: {
            en: 'Part of the 3Blue1Brown neural network series, this video visualizes the mathematics behind backpropagation, the algorithm that powers deep learning. The concepts are explained visually with clear animations that help understand the gradient descent process.',
          },
        },
      },
    },

    // Third entry (index 2) - Gradient descent
    {
      window: homePageCarouselEntries[2].window,
      content: {
        ...homePageCarouselEntries[2].content,
        youtube: {
          videoId: 'IHZwWFHWa-w', // 3Blue1Brown: Gradient Descent
          title: 'Gradient Descent Explained',
          startAt: 45,
          summary: {
            en: "This 3Blue1Brown video provides an intuitive explanation of gradient descent, the optimization algorithm that enables neural networks to learn. Through innovative visualizations, you'll understand how models navigate complex parameter spaces to minimize error.",
          },
        },
      },
    },

    // Fourth entry (index 3) - Linear Algebra
    {
      window: homePageCarouselEntries[3].window,
      content: {
        ...homePageCarouselEntries[3].content,
        youtube: {
          videoId: 'fNk_zzaMoSs', // 3Blue1Brown: Linear Algebra
          title: 'Linear Algebra for AI Engineers',
          startAt: 30,
          summary: {
            en: "This introductory video from 3Blue1Brown's acclaimed Linear Algebra series focuses on the essential math underlying machine learning algorithms. It provides geometric intuition for vectors, matrices, and transformations that form the foundation of AI systems.",
          },
        },
      },
    },

    // Fifth entry (index 4) - Calculus
    {
      window: homePageCarouselEntries[4].window,
      content: {
        ...homePageCarouselEntries[4].content,
        youtube: {
          videoId: 'WUvTyaaNkzM', // 3Blue1Brown: Calculus
          title: 'Calculus for Machine Learning',
          startAt: 60,
          summary: {
            en: "Part of 3Blue1Brown's Essence of Calculus series, this video explains the calculus concepts essential for understanding machine learning algorithms. The visual approach helps software engineers grasp derivatives, integrals, and their application in optimization problems.",
          },
        },
      },
    },

    // Add YouTube videos to other entries
    ...homePageCarouselEntries.slice(5).map((entry, idx) => {
      if (idx % 2 === 0) {
        // More 3Blue1Brown and educational content
        const videos = [
          {
            id: 'KXpfVViPi-I',
            title: 'Deep Learning Algorithms',
            summary: {
              en: 'This 3Blue1Brown collaboration explores cutting-edge deep learning algorithms that power modern AI systems. It covers convolutional neural networks, attention mechanisms, and reinforcement learning through clear, visual explanations.',
            },
          },
          {
            id: 'rBCqOTEfxvg',
            title: 'Probability in Machine Learning',
            summary: {
              en: "This installment from 3Blue1Brown examines how probability theory underlies machine learning models. Through animations and examples, you'll see how Bayesian concepts and statistics inform AI decision-making processes.",
            },
          },
          {
            id: 'kYB8IZa5AuE',
            title: 'Fourier Transforms for AI',
            summary: {
              en: '3Blue1Brown explains Fourier transforms, a powerful mathematical tool used in signal processing and AI applications. This visual guide demonstrates how complex signals can be broken down into simpler components for more effective machine learning.',
            },
          },
          {
            id: 'bM2yD_XZxcU',
            title: 'Visual Information Theory',
            summary: {
              en: "This video explores information theory concepts crucial for AI systems. Through 3Blue1Brown's signature animations, you'll learn about entropy, information content, and how these ideas apply to machine learning model compression and optimization.",
            },
          },
        ];

        return {
          window: entry.window,
          content: {
            ...entry.content,
            youtube: {
              videoId: videos[idx % 4].id,
              title: videos[idx % 4].title,
              startAt: 30,
              summary: videos[idx % 4].summary,
            },
          },
        };
      }
      return entry;
    }),
  ],
};
