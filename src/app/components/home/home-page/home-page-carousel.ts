import { M3WindowSizeClass } from '../../../../modules/m3/components/navigation/m3-navigation-types';
import { LanguageKey } from './home-page-types';
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
    image: {
      url: string;
    };
  };
}

export const carousel: HomePageCarousel = {
  window: {
    [M3WindowSizeClass.Compact]: {
      cols: 0,
      rowHeight: 0,
    },
    [M3WindowSizeClass.Medium]: {
      cols: 0,
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
  },
  defaultEntryWindow: {
    colspan: 1,
    rowspan: 1,
  },
  entries: [
    {
      content: {
        title: {
          en: 'Q&A Rooms with AI',
          de: 'Q&A-Räume mit KI',
          fr: 'Salles Q&R avec IA',
        },
        description: {
          en: "Let ChatGPT answer all knowledge questions. Your prompt presets, by which you narrow down the topic of a room, provide accurate and personalized answers. A quick fact check and you've saved yourself hours of work. Experience how AI makes you more efficient!",
          de: 'Lass ChatGPT alle Wissensfragen beantworten. Deine Prompt-Vorgaben, mit denen du das Thema eines Raumes eingrenzt, sorgen für präzise und personalisierte Antworten. Ein kurzer Faktencheck und du hast dir viele Stunden Arbeit erspart. Erlebe, wie die KI dich effizienter macht!',
          fr: "Laisse ChatGPT répondre à toutes les questions de connaissance. Tes préconfigurations de prompt, qui te permettent de délimiter le thème d'une salle, fournissent des réponses précises et personnalisées. Une vérification rapide des faits et tu as économisé des heures de travail. Découvre comment l'IA te rend plus efficace !",
        },
        image: {
          url: 'url("/assets/background/chat_bot_green.svg")',
        },
      },
      window: {
        [M3WindowSizeClass.Expanded]: {
          colspan: 1,
          rowspan: 1,
        },
        [M3WindowSizeClass.Large]: {
          colspan: 1,
          rowspan: 1,
        },
        [M3WindowSizeClass.ExtraLarge]: {
          colspan: 1,
          rowspan: 1,
        },
      },
    },
  ],
};
