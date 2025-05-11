# Feature Cards Configuration Guide

## Summary of Features

The feature card presentation system on the homepage offers the following capabilities:

- **Interactive Flip Cards**: Cards that flip when clicked to reveal detailed content on the back
- **Multi-language Support**: Content in English, German, and French with automatic language switching
- **Rich Media Integration**: Support for images, SVG icons, HTML5 videos, and YouTube videos
- **Responsive Layout**: Cards automatically adjust to different screen sizes with configurable spans
- **Accessibility Features**: Screen reader support, keyboard navigation, and high contrast mode
- **Visual Effects**: Smooth animations, hover effects, and focus states for enhanced user experience
- **Video Summaries**: Additional text descriptions for videos displayed below the player
- **Custom Styling**: Material Design 3 theming variables for consistent appearance
- **YouTube Integration**: Embeds with thumbnails on small cards and full players on large ones
- **Dynamic Content Loading**: Lazy loading of images and videos for performance optimization

This guide explains how to configure these cards in the `home-page-carousel.ts` file.

## Table of Contents

1. Structure Overview
2. Configuring Card Content
3. Adding Text Content
4. Adding Images
5. Adding Videos
6. Adding YouTube Videos
7. Responsive Layout Configuration
8. Complete Example

## Structure Overview

The feature cards are configured in the `home-page-carousel.ts` file. This file exports a `carousel` object with the following structure:

```typescript
export const carousel: HomePageCarousel = {
  // Window sizing for different device sizes
  window: { ... },

  // Default window size for entries
  defaultEntryWindow: {
    colspan: 1,
    rowspan: 1,
  },

  // Array of card entries
  entries: [
    // Card entries go here
  ]
};
```

Each entry in the `entries` array represents a feature card with front and back sides.

## Configuring Card Content

Each card entry has this structure:

```typescript
{
  // Optional custom window sizing (overrides default)
  window: {
    [M3WindowSizeClass.Large]: { colspan: 2, rowspan: 1 },
    // Other window sizes...
  },

  // The card content (front and back)
  content: {
    // Title in different languages
    title: {
      en: "Feature Title in English",
      de: "Feature-Titel auf Deutsch",
      fr: "Titre de la fonctionnalité en français"
    },

    // Description in different languages (shown on back)
    description: {
      en: "Feature description in English",
      de: "Feature-Beschreibung auf Deutsch",
      fr: "Description de la fonctionnalité en français"
    },

    // Optional image (front of card)
    image?: { ... },

    // Optional video (back of card)
    video?: { ... },

    // Optional YouTube video (back of card)
    youtube?: { ... }
  }
}
```

## Adding Text Content

Text content must be provided in a language dictionary format for English, German, and French:

```typescript
{
  title: {
    en: "Machine Learning Basics",
    de: "Grundlagen des maschinellen Lernens",
    fr: "Principes fondamentaux de l'apprentissage automatique"
  },
  description: {
    en: "Learn about fundamental concepts in machine learning and neural networks through interactive examples and visualizations.",
    de: "Erfahren Sie mehr über grundlegende Konzepte im maschinellen Lernen und neuronalen Netzwerken durch interaktive Beispiele und Visualisierungen.",
    fr: "Découvrez les concepts fondamentaux de l'apprentissage automatique et des réseaux neuronaux à travers des exemples interactifs et des visualisations."
  }
}
```

The system will automatically display the text in the user's selected language.

## Adding Images

Images can be added to the front of the card:

```typescript
image: {
  // URL to the image (can be relative or absolute)
  url: "assets/images/feature-ml-basics.png",

  // Accessible alt text (avoid starting with words like "image of")
  alt: "Neural network diagram showing nodes and connections",

  // Optional: Material icon name (used if URL is not provided)
  svgIcon: "neural_network"
}
```

**Note:** For accessibility reasons, avoid starting alt text with phrases like "image of", "picture of", etc.

## Adding Videos

Regular HTML5 videos can be added to the back of the card:

```typescript
video: {
  // URL to the video file
  url: "assets/videos/ml-demo.mp4",

  // Optional title shown above the video
  title: "Neural Network Demonstration",

  // Whether to show video controls (default: true)
  controls: true,

  // Whether to autoplay when card is flipped (default: false)
  autoplay: false,

  // Whether video should be muted (recommended if autoplay is true)
  muted: true
}
```

## Adding YouTube Videos

YouTube videos provide an enhanced experience with summaries:

```typescript
youtube: {
  // YouTube video ID (the part after v= in YouTube URLs)
  videoId: "aircAruvnKk",

  // Title displayed above the video
  title: "Neural Networks Fundamentals",

  // Start time in seconds (skip intros)
  startAt: 60,

  // Summary text displayed below the video
  summary: "This visual explanation from 3Blue1Brown introduces neural networks from first principles. Using intuitive animations, Grant Sanderson breaks down how neural networks learn and process information, making this complex topic accessible for students and engineers alike."
}
```

On small cards, YouTube videos will show as a thumbnail with a play button that opens the video in a new tab when clicked.

## Responsive Layout Configuration

Cards can be configured to span multiple columns or rows at different screen sizes:

```typescript
window: {
  // Small screens (phones)
  [M3WindowSizeClass.Compact]: {
    colspan: 1,
    rowspan: 1
  },

  // Medium screens (tablets)
  [M3WindowSizeClass.Medium]: {
    colspan: 2,
    rowspan: 1
  },

  // Large screens (desktops)
  [M3WindowSizeClass.Large]: {
    colspan: 2,
    rowspan: 2
  }
}
```

If not specified, the `defaultEntryWindow` values are used.

## Complete Example

Here's a complete example of a card with text, image, and YouTube video:

```typescript
export const carousel: HomePageCarousel = {
  // Window configuration for different screen sizes
  window: {
    [M3WindowSizeClass.Compact]: { cols: 1, rowHeight: 0 },
    [M3WindowSizeClass.Medium]: { cols: 2, rowHeight: 0 },
    [M3WindowSizeClass.Expanded]: { cols: 1, rowHeight: 400 },
    [M3WindowSizeClass.Large]: { cols: 2, rowHeight: 400 },
    [M3WindowSizeClass.ExtraLarge]: { cols: 4, rowHeight: 400 },
    [M3WindowSizeClass.UltraLarge]: { cols: 6, rowHeight: 400 },
  },

  defaultEntryWindow: {
    colspan: 1,
    rowspan: 1,
  },

  entries: [
    // Example 1: Card with image and YouTube video
    {
      window: {
        [M3WindowSizeClass.ExtraLarge]: { colspan: 2, rowspan: 1 },
      },
      content: {
        title: {
          en: "Neural Networks Fundamentals",
          de: "Grundlagen neuronaler Netzwerke",
          fr: "Fondamentaux des réseaux neuronaux",
        },
        description: {
          en: "Understand how neural networks process information through layers of mathematical operations, transforming inputs into meaningful outputs through training algorithms.",
          de: "Verstehen Sie, wie neuronale Netzwerke Informationen durch Schichten mathematischer Operationen verarbeiten und Eingaben durch Trainingsalgorithmen in aussagekräftige Ausgaben umwandeln.",
          fr: "Comprenez comment les réseaux neuronaux traitent l'information à travers des couches d'opérations mathématiques, transformant les entrées en sorties significatives grâce aux algorithmes d'apprentissage.",
        },
        image: {
          url: "assets/images/neural-network.png",
          alt: "Neural network architecture with interconnected nodes",
        },
        youtube: {
          videoId: "aircAruvnKk",
          title: "Neural Networks Fundamentals",
          startAt: 60,
          summary: "This visual explanation from 3Blue1Brown introduces neural networks from first principles. Using intuitive animations, Grant Sanderson breaks down how neural networks learn and process information, making this complex topic accessible for students and engineers alike.",
        },
      },
    },

    // Example 2: Card with SVG icon and regular video
    {
      content: {
        title: {
          en: "Gradient Descent Algorithm",
          de: "Gradientenabstiegsalgorithmus",
          fr: "Algorithme de descente de gradient",
        },
        description: {
          en: "Learn how the gradient descent optimization algorithm works to minimize error functions in machine learning models.",
          de: "Erfahren Sie, wie der Gradientenabstiegsalgorithmus funktioniert, um Fehlerfunktionen in maschinellen Lernmodellen zu minimieren.",
          fr: "Découvrez comment l'algorithme d'optimisation de descente de gradient fonctionne pour minimiser les fonctions d'erreur dans les modèles d'apprentissage automatique.",
        },
        image: {
          svgIcon: "trending_down",
          alt: "Downward trending arrow representing gradient descent",
        },
        video: {
          url: "assets/videos/gradient-descent.mp4",
          title: "Gradient Descent Visualization",
          controls: true,
          autoplay: false,
          muted: true,
        },
      },
    },

    // Additional cards...
  ],
};
```

This configuration will create two feature cards:

1. A card about Neural Networks with an image and YouTube video
2. A card about Gradient Descent with an SVG icon and regular video

You can add as many entries as needed, and they will be arranged according to the responsive grid configuration.
