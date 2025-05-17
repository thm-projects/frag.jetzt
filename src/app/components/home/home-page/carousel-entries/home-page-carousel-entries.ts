/**
 * HOME PAGE CAROUSEL ENTRIES - THE SINGLE SOURCE OF TRUTH FOR CARD CONTENT
 *
 * This file defines all content cards displayed on the application's home page carousel.
 * Each object in the `homePageCarouselEntries` array represents one card.
 *
 * DATA FLOW:
 * 1. Card Data Definition (This File):
 *    - Each card's visual elements (title, description, image, YouTube video, screenshot text)
 *      and its responsive layout behavior (`window` property) are defined here.
 *    - The structure of each card must conform to the `HomePageCarouselEntry` interface.
 *
 * 2. Data Import and Structuring (`../home-page-carousel.ts`):
 *    - The `homePageCarouselEntries` array from this file is imported by `../home-page-carousel.ts`.
 *    - That file then maps these entries into the `carousel.entries` array. This `carousel` object
 *      also includes global carousel layout settings (e.g., number of columns for the grid).
 *    - `../home-page-carousel.ts` directly uses the `content` objects defined here without modification.
 *
 * 3. Rendering by Angular Component (`../feature-grid/feature-grid.component.ts`):
 *    - The `FeatureGridComponent` consumes the `carousel` object (from `../home-page-carousel.ts`).
 *    - It iterates over `carousel.entries` and uses the data (title, description, media,
 *      colspan/rowspan) to render each card in its HTML template.
 *
 * STRUCTURE OF EACH ENTRY (`HomePageCarouselEntry`):
 * - `content`: An object holding all multilingual text (title, description, summary) and
 *              media (image, YouTube video, screenshot with text). This is the core
 *              visual information for the card.
 * - `window`:  An object defining the card's responsive layout behavior. It specifies
 *              how many columns (`colspan`) and rows (`rowspan`) each card occupies
 *              within the grid layout at different screen sizes (`M3WindowSizeClass`).
 *
 * FORMATTING NOTES FOR TEXT:
 * - For text containing apostrophes (e.g., "don't", "it's"), use:
 *   - Template literals: `This doesn't cause errors`
 *   - Double quotes: "This doesn't cause errors"
 *   - Escaped apostrophes: 'This doesn\'t cause errors'
 *
 * IMAGE TYPES:
 * - Card Front Side (`content.image`):
 *   - Can use either `{ url: '/path/to/image.png' }` for standard images.
 *   - Or `{ svgIcon: 'icon_name' }` to use an SVG icon registered with MatIconRegistry.
 * - Card Back Side / Detail View (`content.screenshotText.screenshot.url`):
 *   - Must use the `{ url: '/path/to/image.png' }` format.
 *
 * TEXT LENGTH RECOMMENDATIONS:
 * - `content.description`: Keep under 500 characters per language for optimal display
 *   on the card's front side.
 * - `content.screenshotText.text`: This text is scrollable, so length is less critical.
 *   HTML formatting is supported here.
 * - `content.youtube.summary`: Keep concise for display alongside the video.
 */

import { HomePageCarouselEntry } from '../home-page-carousel'; // Interface defining the structure for each card entry
import { M3WindowSizeClass } from '../../../../../modules/m3/components/navigation/m3-navigation-types'; // Enum for screen size classifications

// Reusable window size configuration for standard 1x1 cards.
// This defines that the card will take 1 column and 1 row
// across various screen sizes (Expanded, Large, ExtraLarge, UltraLarge).
const _1x1windowSize: HomePageCarouselEntry['window'] = {
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
  [M3WindowSizeClass.UltraLarge]: {
    colspan: 1,
    rowspan: 1,
  },
};

// The main array holding all card definitions.
// Each object in this array will be rendered as a card in the carousel
// by the FeatureGridComponent.
export const homePageCarouselEntries: HomePageCarouselEntry[] = [
  // Card 1: Q&A Rooms & AI Assistants
  {
    // `content` object: Contains all visual and textual information for this card.
    content: {
      // `title`: Multilingual title of the card.
      title: {
        en: 'Q&A Rooms & AI Assistants',
        de: 'Q&A-Räume & KI-Assistenten',
        fr: 'Salles Q&R & Assistants IA',
      },
      // `description`: Multilingual description displayed on the card's front.
      description: {
        en: 'The AI assistants in frag.jetzt provide instant answers to questions in your educational rooms. They can be customized with specific prompts to ensure accurate and contextual responses focused on your topic. Key benefits include 24/7 availability for student questions, customizable knowledge boundaries, support for multiple languages, automatic citation of sources, and moderation options to ensure appropriate content.',
        de: 'Die KI-Assistenten in frag.jetzt liefern sofortige Antworten auf Fragen in deinen Lernräumen. Sie können mit spezifischen Prompts angepasst werden, um genaue und kontextbezogene Antworten zu deinem Thema zu gewährleisten. Hauptvorteile sind 24/7 Verfügbarkeit für Studentenfragen, anpassbare Wissensgrenzen, Unterstützung für mehrere Sprachen, automatische Quellenangaben und Moderationsoptionen für angemessene Inhalte.',
        fr: 'Les assistants IA dans frag.jetzt fournissent des réponses instantanées aux questions dans vos salles éducatives. Ils peuvent être personnalisés avec des prompts spécifiques pour assurer des réponses précises et contextuelles centrées sur votre sujet. Les avantages clés comprennent la disponibilité 24/7 pour les questions des étudiants, des limites de connaissances personnalisables, le support pour plusieurs langues, la citation automatique des sources et des options de modération pour assurer un contenu approprié.',
      },
      // `image`: Image for the card's front. Here, an SVG icon is used.
      image: {
        svgIcon: 'fj_robot',
      },
      // `screenshotText`: Optional. Defines content for a "flipped" or detail view,
      // typically showing a screenshot alongside scrollable text.
      screenshotText: {
        screenshot: {
          url: '/assets/images/Use_Case_Diagram.svg', // URL for the screenshot image.
          alt: {
            // Alt text for the screenshot, for accessibility.
            en: 'AI assistant robot icon',
            de: 'KI-Assistenten Roboter-Symbol',
            fr: 'Icône de robot assistant IA',
          },
        },
        text: {
          // Multilingual text to accompany the screenshot. Can include HTML.
          en: 'The AI assistants in frag.jetzt provide instant answers to questions in your educational rooms. They can be customized with specific prompts to ensure accurate and contextual responses focused on your topic. Key benefits include 24/7 availability for student questions, customizable knowledge boundaries, support for multiple languages, automatic citation of sources, and moderation options to ensure appropriate content.',
          de: 'Die KI-Assistenten in frag.jetzt liefern sofortige Antworten auf Fragen in deinen Lernräumen. Sie können mit spezifischen Prompts angepasst werden, um genaue und kontextbezogene Antworten zu deinem Thema zu gewährleisten. Hauptvorteile sind 24/7 Verfügbarkeit für Studentenfragen, anpassbare Wissensgrenzen, Unterstützung für mehrere Sprachen, automatische Quellenangaben und Moderationsoptionen für angemessene Inhalte.',
          fr: 'Les assistants IA dans frag.jetzt fournissent des réponses instantanées aux questions dans vos salles éducatives. Ils peuvent être personnalisés avec des prompts spécifiques pour assurer des réponses précises et contextuelles centrées sur votre sujet. Les avantages clés comprennent la disponibilité 24/7 pour les questions des étudiants, des limites de connaissances personnalisables, le support pour plusieurs langues, la citation automatique des sources et des options de modération pour assurer un contenu approprié.',
        },
      },
      // `youtube`: Optional. If present, defines a YouTube video associated with the card,
      // often shown on the "back" or in a detail view.
    },
    // `window` object: Defines how this card spans columns and rows in the grid
    // for different screen sizes.
    window: {
      [M3WindowSizeClass.Expanded]: {
        // Screen size: Expanded
        colspan: 1, // Takes 1 grid column
        rowspan: 1, // Takes 1 grid row
      },
      [M3WindowSizeClass.Large]: {
        colspan: 1,
        rowspan: 1,
      },
      [M3WindowSizeClass.ExtraLarge]: {
        colspan: 1,
        rowspan: 1,
      },
      [M3WindowSizeClass.UltraLarge]: {
        colspan: 1,
        rowspan: 1,
      },
    },
  },
  // Card 2: Teach with AI
  {
    content: {
      title: {
        en: 'Teach with AI',
        de: 'Lehre mit KI',
        fr: "Enseigne avec l'IA",
      },
      description: {
        en: 'Transform teaching with AI support: Generate summaries of educational materials. Extract learning objectives and technical terms. Create exercises and exam questions from slides. Evaluate student submissions with detailed feedback. Provide 24/7 assistance to students. The AI works as your teaching assistant, handling routine tasks so you can focus on meaningful interactions.',
        de: 'Transformiere deine Lehre mit KI: Erstelle Zusammenfassungen von Lehrmaterialien. Extrahiere Lernziele und Fachbegriffe. Generiere Übungen und Prüfungsfragen aus Folien. Bewerte Einreichungen mit detailliertem Feedback. Biete 24/7-Unterstützung für Studierende. Die KI fungiert als Assistent, übernimmt Routineaufgaben und ermöglicht mehr Zeit für Interaktionen.',
        fr: "Transformez votre enseignement avec l'IA: Générez des résumés de matériaux éducatifs. Extrayez objectifs d'apprentissage et termes techniques. Créez exercices et questions d'examen à partir de diapositives. Évaluez les travaux avec feedback détaillé. Offrez assistance 24/7 aux étudiants. L'IA fonctionne comme assistant, gérant les tâches routinières pour vous permettre de vous concentrer sur les interactions.",
      },
      image: {
        url: '/assets/background/teaching.svg', // Standard image URL for the card front.
      },
      screenshotText: {
        screenshot: {
          url: '/assets/images/Domain_Diagram.svg',
          alt: {
            en: 'Teaching with AI illustration',
            de: 'Illustration zum Lehren mit KI',
            fr: "Illustration d'enseignement avec l'IA",
          },
        },
        text: {
          en: 'The AI summarizes the chapters of your script...',
          de: 'Die KI fasst die Kapitel deines Skripts zusammen...',
          fr: "L'IA résume les chapitres de ton script...",
        },
      },
    },
    window: _1x1windowSize, // Uses the reusable 1x1 window configuration.
  },
  // Card 3: AI Assistants (Research Study)
  {
    content: {
      title: {
        en: 'AI Assistants',
        de: 'KI-Assistenten',
        fr: 'Assistants IA',
      },
      description: {
        en: 'Join our research study on AI in education: Get access to the latest language models. Use AI across all your rooms for educational purposes. Share your feedback on AI integration in education. Help shape the future of AI-enhanced learning. Your participation helps research how AI can support education while maintaining ethical standards. Contact us through the imprint page to join.',
        de: 'Nimm an unserer Forschungsstudie zu KI in der Bildung teil: Erhalte Zugang zu neuesten Sprachmodellen. Nutze KI in deinen Räumen für Bildungszwecke. Teile dein Feedback zur KI-Integration. Hilf, die Zukunft des KI-unterstützten Lernens zu gestalten. Deine Teilnahme unterstützt die Forschung zur Bildungsförderung durch KI unter Einhaltung ethischer Standards. Kontaktiere uns über die Impressum-Seite.',
        fr: "Participez à notre étude sur l'IA dans l'éducation: Accédez aux derniers modèles linguistiques. Utilisez l'IA dans vos salles éducatives. Partagez vos commentaires sur l'intégration de l'IA. Aidez à façonner l'avenir de l'apprentissage avec IA. Votre participation aide la recherche sur le soutien éducatif par l'IA tout en respectant les normes éthiques. Contactez-nous via la page mentions légales.",
      },
      image: {
        url: '/assets/background/KI-Chatbot-MNI-1024.webp',
      },
      screenshotText: {
        screenshot: {
          url: '/assets/images/frag.jetzt_startpage_wide.png',
          alt: {
            en: 'AI Chatbot interface',
            de: 'KI-Chatbot Oberfläche',
            fr: 'Interface du chatbot IA',
          },
        },
        text: {
          en: 'Take part in our study »AI assistants in teaching & studying«...',
          de: 'Nimm an unserer Studie »KI-Assistenten in Lehre & Studium« teil...',
          fr: "Participe à notre étude « Les assistants IA dans l'enseignement et l'étude »...",
        },
      },
    },
    // This card has a custom window configuration, making it larger on bigger screens.
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
        // On ExtraLarge screens...
        colspan: 2, // ...it takes 2 columns.
        rowspan: 2, // ...and 2 rows, making it a 2x2 card.
      },
      [M3WindowSizeClass.UltraLarge]: {
        // On UltraLarge screens...
        colspan: 2, // ...it also takes 2 columns.
        rowspan: 2, // ...and 2 rows.
      },
    },
  },
  // Card 4: Learn with AI
  {
    content: {
      title: {
        en: 'Learn with AI',
        de: 'Lerne mit KI',
        fr: "Apprends avec l'IA",
      },
      description: {
        en: 'Create your own rooms: one room per course. Ask the AI questions about your lectures. Give the AI assistant your transcript and let it generate learning materials from it: from Anki flashcards to exam questions. Be quizzed before the exam: face the quiz duel with the AI!',
        de: 'Erstelle deine eigenen Räume: ein Raum pro Kurs. Stelle der KI Fragen zu deinen Vorlesungen. Gib dem KI-Assistenten deine Mitschrift und lass ihn daraus Lernmaterialien generieren: von Anki-Flashcards bis hin zu Prüfungsfragen. Lass dich vor der Prüfung abfragen: Stell dich dem Quizduell mit der KI!',
        fr: "Crée tes propres salles : une salle par cours. Pose à l'IA des questions sur tes cours. Donne ta transcription à l'assistant IA et laisse-le générer des supports d'apprentissage à partir de celle-ci : des flashcards Anki aux questions d'examen. Sois interrogé avant l'examen : affronte le duel de quiz avec l'IA !",
      },
      image: {
        url: '/assets/background/learning.svg',
      },
      // This card features a YouTube video.
      youtube: {
        videoId: 'azjV4WslLZ4', // The ID of the YouTube video.
        title: 'Solving the heat equation | DE4', // Optional title for the video.
      },
    },
    window: _1x1windowSize,
  },
  // Card 5: Write with AI
  {
    content: {
      title: {
        en: 'Write with AI',
        de: 'Schreibe mit KI',
        fr: "Écris avec l'IA",
      },
      description: {
        en: "Use AI to enhance your writing: Overcome writer's block with fresh ideas and outlines. Improve clarity and flow. Find better phrasings for complex concepts. Generate code samples and explain programming concepts. Check logic and syntax in technical documents. The AI works as your personal writing assistant while you maintain creative control.",
        de: 'Nutze KI zur Verbesserung deiner Texte: Überwinde Schreibblockaden mit Ideen und Gliederungen. Verbessere Klarheit und Textfluss. Finde bessere Formulierungen für komplexe Konzepte. Generiere Code und erkläre Programmierkonzepte. Prüfe Logik und Syntax in technischen Dokumenten. Die KI arbeitet als dein Schreibassistent, während du die kreative Kontrolle behältst.',
        fr: "Utilisez l'IA pour améliorer votre écriture: Surmontez le syndrome de la page blanche avec des idées et plans. Améliorez clarté et fluidité. Trouvez meilleures formulations pour concepts complexes. Générez exemples de code et expliquez concepts de programmation. Vérifiez logique et syntaxe des documents techniques. L'IA fonctionne comme assistant d'écriture personnel pendant que vous gardez le contrôle créatif.",
      },
      image: {
        url: '/assets/background/keyboard.webp',
      },
      youtube: {
        videoId: 'azjV4WslLZ4',
        title: 'Guidde',
        startAt: 0,
        summary: {
          en: "This video elegantly introduces the concepts of divergence and curl, essential for understanding electromagnetic fields and fluid dynamics. Through stunning visual explanations, Grant Sanderson reveals how these mathematical operations describe the physical world in Maxwell's equations.",
          de: 'Dieses Video führt elegant in die Konzepte der Divergenz und Rotation ein, die für das Verständnis elektromagnetischer Felder und Fluiddynamik unerlässlich sind. Durch atemberaubende visuelle Erklärungen zeigt Grant Sanderson, wie diese mathematischen Operationen die physikalische Welt in Maxwells Gleichungen beschreiben.',
          fr: 'Cette vidéo présente élégamment les concepts de divergence et de rotationnel, essentiels pour comprendre les champs électromagnétiques et la dynamique des fluides. À travers des explications visuelles époustouflantes, Grant Sanderson révèle comment ces opérations mathématiques décrivent le monde physique dans les équations de Maxwell.',
        },
      },
    },
    window: _1x1windowSize,
  },
  // Card 6: Pre-Prompting & Role-playing
  {
    content: {
      title: {
        en: 'Pre-Prompting & Role-playing',
        de: 'Pre-Prompting & Rollenspiel',
        fr: 'Pré-Prompting & Jeu de rôle',
      },
      description: {
        en: 'You can define the role that the AI assistant should play in your room. Also the format and scope of its responses. You can use keywords to focus the chat on a specific topic. The assistant rejects inappropriate questions in a friendly manner.',
        de: 'Du kannst die Rolle festlegen, die der KI-Assistent in deinem Raum spielen soll. Auch das Format und den Umfang seiner Antworten. Mit Schlüsselwörtern fokussierst du den Chat auf ein Thema. Unpassende Fragen weist der Assistent freundlich zurück.',
        fr: "Tu peux définir le rôle que l'assistant IA doit jouer dans ta salle. De même que le format et la portée de ses réponses. Avec des mots-clés, tu focalises le chat sur un thème. L'assistant rejette gentiment les questions inappropriées.",
      },
      image: {
        url: '/assets/background/prompting.svg',
      },
      youtube: {
        videoId: 'azjV4WslLZ4&t',
        title: "What they won't teach you in calculus | DE6",
        startAt: 0,
        summary: {
          en: 'This eye-opening video reveals the deeper intuitions behind calculus that are rarely taught in standard courses. Grant Sanderson demonstrates how differential equations connect to geometric interpretations, providing insights that transform how you think about mathematics.',
          de: 'Dieses augenöffnende Video enthüllt die tieferen Intuitionen hinter der Differentialrechnung, die in Standardkursen selten gelehrt werden. Grant Sanderson zeigt, wie Differentialgleichungen mit geometrischen Interpretationen verbunden sind und liefert Erkenntnisse, die die Art und Weise, wie du über Mathematik denkst, verändern.',
          fr: 'Cette vidéo révélatrice dévoile les intuitions plus profondes derrière le calcul qui sont rarement enseignées dans les cours standard. Grant Sanderson démontre comment les équations différentielles se connectent aux interprétations géométriques, fournissant des perspectives qui transforment votre façon de penser aux mathématiques.',
        },
      },
    },
    window: _1x1windowSize,
  },
  // Card 7: Good Questions
  {
    content: {
      title: {
        en: 'Good Questions',
        de: 'Gute Fragen',
        fr: 'Bonnes Questions',
      },
      description: {
        en: 'Boost engagement and reward good questions with a star! Stars can be redeemed for bonus points via email. This appreciation motivates and contributes to a positive learning culture.',
        de: 'Fördere Engagement und belohne gute Fragen mit einem Stern! Sterne können per Mail in Bonuspunkte eingelöst werden. Diese Wertschätzung motiviert  und trägt zu einer positiven Lernkultur bei.',
        fr: "Stimule l'engagement et récompense les bonnes questions par une étoile ! Les étoiles peuvent être échangées contre des points bonus par email. Cette reconnaissance motive et contribue à une culture d'apprentissage positive.",
      },
      image: {
        url: '/assets/background/bonus.svg',
      },
      youtube: {
        videoId: 'naQOIBMhNr0',
        title: 'The most unexpected answer to a counting puzzle | DE7',
        startAt: 0,
        summary: {
          en: 'This mind-bending video shows how a seemingly simple counting problem leads to a surprising connection with differential equations. Grant Sanderson demonstrates how mathematical curiosity can reveal unexpected relationships between different fields of mathematics.',
          de: 'Dieses verblüffende Video zeigt, wie ein scheinbar einfaches Zählproblem zu einer überraschenden Verbindung mit Differentialgleichungen führt. Grant Sanderson demonstriert, wie mathematische Neugier unerwartete Beziehungen zwischen verschiedenen Bereichen der Mathematik aufdecken kann.',
          fr: 'Cette vidéo déconcertante montre comment un problème de comptage apparemment simple mène à une connexion surprenante avec les équations différentielles. Grant Sanderson démontre comment la curiosité mathématique peut révéler des relations inattendues entre différents domaines des mathématiques.',
        },
      },
    },
    window: _1x1windowSize,
  },
  // Card 8: Moderation
  {
    content: {
      title: {
        en: 'Moderation',
        de: 'Moderation',
        fr: 'Modération',
      },
      description: {
        en: 'Want to check posts before they go live? Use manual or AI moderation. AI flags toxic language and hate speech. Negative ratings can move posts to moderation. This way, the group helps keep discussions respectful.',
        de: 'Du willst Beiträge vor der Veröffentlichung prüfen? Nutze manuelle oder KI-Moderation. Die KI erkennt toxische Sprache und Hate Speech. Negative Bewertungen können Beiträge in die Moderation verschieben. So sorgt die Gruppe für respektvolle Diskussionen.',
        fr: 'Tu veux vérifier les posts avant publication ? Utilise la modération manuelle ou par IA. L’IA détecte le langage toxique et les discours haineux. Les avis négatifs peuvent déplacer les posts en modération. Ainsi, le groupe garantit des échanges respectueux.',
      },
      image: {
        url: '/assets/background/moderation-2.svg',
      },
      youtube: {
        videoId: 'spUNpyF58BY',
        title: 'But what is the Fourier Transform? | DE8',
        startAt: 0,
        summary: {
          en: "This incredible video demystifies the Fourier Transform, a powerful mathematical tool with applications in signal processing, quantum physics, and differential equations. Grant Sanderson's unique visual approach transforms complex mathematics into intuitive understanding.",
          de: 'Dieses unglaubliche Video entmystifiziert die Fourier-Transformation, ein leistungsstarkes mathematisches Werkzeug mit Anwendungen in der Signalverarbeitung, Quantenphysik und Differentialgleichungen. Grant Sandersons einzigartiger visueller Ansatz verwandelt komplexe Mathematik in intuitives Verständnis.',
          fr: "Cette incroyable vidéo démystifie la transformée de Fourier, un puissant outil mathématique avec des applications dans le traitement du signal, la physique quantique et les équations différentielles. L'approche visuelle unique de Grant Sanderson transforme les mathématiques complexes en une compréhension intuitive.",
        },
      },
    },
    window: _1x1windowSize,
  },
  // Card 9: Categories
  {
    content: {
      title: {
        en: 'Categories',
        de: 'Kategorien',
        fr: 'Catégories',
      },
      description: {
        en: 'Use »labels« to categorize questions and filter by topic. In lectures, try »Clarification« or »Exam Prep«. At conferences, use »Keynote« or »Technical Discussion«. AI-generated keywords from posts also help with filtering, making it easier to find relevant contributions quickly.',
        de: 'Nutze »Labels«, um Fragen zu kategorisieren und nach Themen zu filtern. In Vorlesungen eignen sich »Klärung« oder »Prüfungsvorbereitung«, in Konferenzen »Keynote« oder »Fachdiskussion«. Auch KI-Stichwörter helfen beim Filtern und erleichtern das schnelle Auffinden relevanter Beiträge.',
        fr: 'Utilise des « labels » pour classer et filtrer les questions. En cours, choisis « Clarification » ou « Préparation aux examens ». En conférence, « Keynote » ou « Discussion technique ». Les mots-clés IA facilitent aussi le filtrage et permettent de retrouver rapidement les contributions pertinentes.',
      },
      image: {
        url: '/assets/background/folders.svg',
      },
      youtube: {
        videoId: 'Jo0NuaCyQF0',
        title: 'Information Architecture Fundamentals',
        startAt: 0,
        summary: {
          en: 'Learn the principles of effective information organization and categorization. This presentation covers taxonomy design, labeling systems, and search functionality that help users navigate complex information landscapes and find what they need quickly and intuitively.',
          de: 'Lerne die Grundlagen einer effektiven Informationsorganisation und Kategorisierung. Diese Präsentation behandelt Taxonomiedesign, Beschriftungssysteme und Suchfunktionalität, die Benutzern helfen, komplexe Informationslandschaften zu navigieren und schnell und intuitiv zu finden, was sie brauchen.',
          fr: "Apprenez les principes d'une organisation et d'une catégorisation efficaces de l'information. Cette présentation couvre la conception de taxonomies, les systèmes d'étiquetage et les fonctionnalités de recherche qui aident les utilisateurs à naviguer dans des paysages d'information complexes et à trouver ce dont ils ont besoin rapidement et intuitivement.",
        },
      },
    },
    window: _1x1windowSize,
  },
  // Card 10: Mail Service
  {
    content: {
      title: {
        en: 'Mail Service',
        de: 'Mail-Service',
        fr: 'Service Mail',
      },
      description: {
        en: "You can use a room on a one-time or long-term basis. It's understandable that you don't want to search for new posts in each room every day. That's why we've set up a mail option for every room. You decide whether and when you want to receive notifications – an exclusive service for registered users.",
        de: 'Du kannst einen Raum einmalig oder langfristig nutzen. Klar, dass du nicht jeden Tag in jedem Raum nach neuen Beiträgen suchen willst. Deshalb haben wir eine Mail-Option eingerichtet. Du entscheidest, ob und wann du Benachrichtigungen erhalten möchtest – ein exklusiver Service für registrierte User.',
        fr: "Tu peux utiliser une salle une seule fois ou à long terme. Il est compréhensible que tu ne veuilles pas chercher de nouveaux posts dans chaque salle chaque jour. C'est pourquoi nous avons mis en place une option mail pour chaque salle. Tu décides si et quand tu veux recevoir des notifications – un service exclusif pour les utilisateurs enregistrés.",
      },
      image: {
        url: '/assets/background/at-sign.svg',
      },
      youtube: {
        videoId: 'p_di4Zn4wz4',
        title: 'Differential equations, introduction | DE1',
        startAt: 0,
        summary: {
          en: "This video introduces the beautiful world of differential equations and why they're worth studying. Through elegant animations, Grant Sanderson shows how these equations connect mathematics to the physical world and help us model change in countless scientific domains.",
          de: 'Dieses Video führt in die wunderschöne Welt der Differentialgleichungen ein und erklärt, warum sie es wert sind, studiert zu werden. Durch elegante Animationen zeigt Grant Sanderson, wie diese Gleichungen Mathematik mit der physischen Welt verbinden und uns helfen, Veränderungen in unzähligen wissenschaftlichen Bereichen zu modellieren.',
          fr: "Cette vidéo présente le monde magnifique des équations différentielles et explique pourquoi elles méritent d'être étudiées. À travers d'élégantes animations, Grant Sanderson montre comment ces équations relient les mathématiques au monde physique et nous aident à modéliser le changement dans d'innombrables domaines scientifiques.",
        },
      },
    },
    window: _1x1windowSize,
  },
  // Card 11: Peer Instruction
  {
    content: {
      title: {
        en: 'Peer Instruction',
        de: 'Peer Instruction',
        fr: 'Peer Instruction',
      },
      description: {
        en: 'Let the AI assistant explain the evidence-based teaching method of peer instruction to you. frag.jetzt supports you in its application: students answer concept questions and discuss their answers with the person sitting next to them. They argue their answers and thus develop a deeper understanding of the material. With frag.jetzt, peer instruction becomes an integral part of your lecture!',
        de: 'Lass dir vom KI-Assistenten die evidenzbasierte Lehrmethode Peer Instruction erklären. frag.jetzt unterstützt dich bei der Anwendung: Studierende beantworten Konzeptfragen und diskutieren ihre Antworten mit ihren Sitznachbarn. Sie argumentieren ihre Antworten und entwickeln so ein tieferes Verständnis des Stoffes. Mit frag.jetzt wird Peer Instruction zum festen Bestandteil deiner Vorlesung!',
        fr: "Laisse l'assistant IA t'expliquer la méthode d'enseignement basée sur les preuves « Peer Instruction ». frag.jetzt t'aide à l'appliquer : Les étudiants répondent à des questions conceptuelles et discutent de leurs réponses avec leurs voisins de siège. Ils argumentent leurs réponses et développent ainsi une compréhension plus approfondie de la matière. Avec frag.jetzt, tu fais de la Peer Instruction une partie intégrante de ton enseignement !",
      },
      image: {
        url: '/assets/background/Peer-Instruction.webp',
      },
      youtube: {
        videoId: 'ly4S0oi3Yz8',
        title: 'But what is a differential equation? | DE2',
        startAt: 0,
        summary: {
          en: "This captivating video explains what differential equations actually are and why they're so fundamental in science and engineering. Using visual intuition rather than formal notation, Grant Sanderson makes these powerful mathematical tools accessible to learners at all levels.",
          de: 'Dieses fesselnde Video erklärt, was Differentialgleichungen eigentlich sind und warum sie in Wissenschaft und Ingenieurwesen so grundlegend sind. Durch visuelle Intuition anstelle formaler Notation macht Grant Sanderson diese leistungsstarken mathematischen Werkzeuge für Lernende aller Niveaus zugänglich.',
          fr: "Cette vidéo captivante explique ce que sont réellement les équations différentielles et pourquoi elles sont si fondamentales en science et en ingénierie. En utilisant l'intuition visuelle plutôt que la notation formelle, Grant Sanderson rend ces puissants outils mathématiques accessibles aux apprenants de tous niveaux.",
        },
      },
    },
    window: _1x1windowSize,
  },
  // Card 12: Quiz Rally
  {
    content: {
      title: {
        en: 'Quiz Rally',
        de: 'Quiz-Rallye',
        fr: 'Rallye quiz',
      },
      description: {
        en: 'Energize with an interactive quiz! Liven up your teaching with competitions. Whoever answers quickly and correctly gets rewarded with bonus points. This way, learning becomes a fun group experience!',
        de: 'Aktiviere mit Quizfragen! Lockere deinen Unterricht mit Wettbewerben auf. Wer schnell und richtig antwortet, wird mit Bonuspunkten belohnt. So wird Lernen zum unterhaltsamen Gruppenerlebnis!',
        fr: "Anime avec un quiz interactif ! Rends ton enseignement plus vivant avec des compétitions. Celui qui répond vite et correctement est récompensé par des points bonus. Ainsi, l'apprentissage devient une expérience de groupe amusante !",
      },
      image: {
        url: '/assets/background/quizzing-7.webp',
      },
      youtube: {
        videoId: 'LwCRRUa8yTU',
        title: 'Visualizing solutions to differential equations | DE3',
        startAt: 0,
        summary: {
          en: 'This mesmerizing video shows how to understand differential equations through geometric visualization. Grant Sanderson demonstrates powerful techniques for visualizing solutions as flows in space, making abstract mathematical concepts concrete and intuitive.',
          de: 'Dieses faszinierende Video zeigt, wie man Differentialgleichungen durch geometrische Visualisierung verstehen kann. Grant Sanderson demonstriert leistungsstarke Techniken zur Visualisierung von Lösungen als Flüsse im Raum, wodurch abstrakte mathematische Konzepte konkret und intuitiv werden.',
          fr: "Cette vidéo hypnotisante montre comment comprendre les équations différentielles grâce à la visualisation géométrique. Grant Sanderson démontre des techniques puissantes pour visualiser les solutions comme des flux dans l'espace, rendant concrets et intuitifs des concepts mathématiques abstraits.",
        },
      },
    },
    window: _1x1windowSize,
  },
  // Card 13: Flash Polls
  {
    content: {
      title: {
        en: 'Flash Polls',
        de: 'Blitzumfragen',
        fr: 'Sondages Éclairs',
      },
      description: {
        en: 'Get real-time feedback with just one click! Numerous templates are available for you. Use flash polls to optimize your event and to find out if everyone can follow you.',
        de: 'Hol dir Feedback in Echtzeit mit nur einem Klick! Zahlreiche Vorlagen stehen dir zur Verfügung. Nutze Blitzumfragen, um deine Vorträge zu optimieren. Finde heraus, ob dir alle folgen können.',
        fr: 'Reçois du feedback en temps réel avec un simple clic ! De nombreux modèles sont à ta disposition. Utilise des sondages éclair pour optimiser ton événement et pour savoir si tout le monde peut te suivre.',
      },
      image: {
        url: '/assets/background/feedback.webp',
      },
    },
    window: _1x1windowSize,
  },
  // Card 14: Brainstorming
  {
    content: {
      title: {
        en: 'Brainstorming',
        de: 'Brainstorming',
        fr: 'Brainstorming',
      },
      description: {
        en: 'Stir up the creativity of your group with an interactive brainstorming session! Ask the focus question and visualize all ideas in real-time in a word cloud. Bonus tip: With just one click, AI generates as many ideas as you need!',
        de: 'Wecke die Kreativität deiner Gruppe! Mit einem Brainstorming wird es gelingen! Stelle die Fokusfrage und visualisiere alle Ideen in Echtzeit in einer Wortwolke. Bonustipp: Mit nur einem Klick generiert die KI beliebig viele Ideen zu jedem Thema!',
        fr: "Réveille la créativité de ton groupe avec un brainstorming interactif  Pose la question de focus et visualise toutes les idées en temps réel dans un nuage de mots. Conseil bonus : Avec un simple clic, l'IA génère autant d'idées que tu en as besoin !",
      },
      image: {
        url: '/assets/background/brainstorming.svg',
      },
    },
    window: _1x1windowSize,
  },
  // Card 15: Question Focus
  {
    content: {
      title: {
        en: 'Question Focus',
        de: 'Fragen-Fokus',
        fr: 'Focus sur les Questions',
      },
      description: {
        en: 'Present questions with style and impact! Show individual questions in large format on the projector. Switch to autofocus to automatically display new questions in full screen. Focus on questions that have been highly rated or controversially discussed.',
        de: 'Präsentier Fragen mit Stil und Wirkung! Zeig einzelne Fragen im Großformat am Beamer. Schalt auf Autofokus, um neue Fragen automatisch anzuzeigen. Wähle die passende Blende für hoch bewertete oder kontroverse Fragen.',
        fr: "Présente des questions avec style et impact ! Affiche des questions individuelles en grand format sur le projecteur. Passe en autofocus pour afficher automatiquement les nouvelles questions en plein écran. Concentre-toi sur les questions qui ont été très bien notées ou qui ont fait l'objet de discussions controversées.",
      },
      image: {
        url: '/assets/background/lens.svg',
      },
    },
    window: _1x1windowSize,
  },
  // Card 16: Question Radar
  {
    content: {
      title: {
        en: 'Question Radar',
        de: 'Fragen-Radar',
        fr: 'Radar de Questions',
      },
      description: {
        en: 'Effortlessly keep track of hundreds of questions! An AI analyzes them and suggests keywords. With the question radar, you get a quick overview of the central themes and can reach the hotspots in the Q&A forum with just one click!',
        de: 'Behalte den Überblick über hunderte von Fragen! Eine KI analysiert sie und schlägt Stichwörter vor. Auf dem Radarschirm siehst du die zentralen Themen. Mit nur einem Klick springst du zu den Hotspots ins Q&A-Forum!',
        fr: "Garde facilement une vue d'ensemble sur des centaines de questions ! Une IA les analyse et suggère des mots-clés. Avec le radar de questions, tu obtiens un aperçu rapide des thèmes centraux et tu peux atteindre les points chauds dans le forum Q&R en un seul clic !",
      },
      image: {
        url: '/assets/background/question_radar.svg',
      },
      youtube: {
        videoId: 'Jo0NuaCyQF0',
        title: 'Information Architecture Fundamentals',
        startAt: 0,
        summary: {
          en: 'Learn the principles of effective information organization and categorization. This presentation covers taxonomy design, labeling systems, and search functionality that help users navigate complex information landscapes and find what they need quickly and intuitively.',
          de: 'Lerne die Grundlagen einer effektiven Informationsorganisation und Kategorisierung. Diese Präsentation behandelt Taxonomiedesign, Beschriftungssysteme und Suchfunktionalität, die Benutzern helfen, komplexe Informationslandschaften zu navigieren und schnell und intuitiv zu finden, was sie brauchen.',
          fr: "Apprenez les principes d'une organisation et d'une catégorisation efficaces de l'information. Cette présentation couvre la conception de taxonomies, les systèmes d'étiquetage et les fonctionnalités de recherche qui aident les utilisateurs à naviguer dans des paysages d'information complexes et à trouver ce dont ils ont besoin rapidement et intuitivement.",
        },
      },
    },
    window: _1x1windowSize,
  },
  // Card 17: Navigation
  {
    content: {
      title: {
        en: 'Navigation',
        de: 'Navigation',
        fr: 'Navigation',
      },
      description: {
        en: "Looking for the manual? Don't worry, you won't need one. There is only one menu: The navigation on the top left. The navigation gives you access to the features of the platform. The options for each feature are found in the submenus of the navigation. It couldn't be simpler.",
        de: 'Suchst du das Handbuch? Keine Sorge, du brauchst keins. Es gibt nur ein Menü: Die Navigation oben links. Über die Navigation kannst du auf die Features der Plattform zugreifen. Die Optionen zu den einzelnen Features findest du in den Untermenüs der Navigation. Einfacher geht’s nicht.',
        fr: "Tu cherches le manuel ? Ne t'inquiète pas, tu n'en auras pas besoin. Il n'y a qu'un seul menu : La navigation en haut à gauche. La navigation te donne accès aux fonctionnalités de la plateforme. Les options de chaque fonctionnalité se trouvent dans les sous-menus de la navigation. On ne peut pas faire plus simple.",
      },
      image: {
        url: '/assets/background/compass.svg',
      },
    },
    window: _1x1windowSize,
  },
  // Card 18: Test frag.jetzt!
  {
    content: {
      title: {
        en: 'Test frag.jetzt!',
        de: 'Teste frag.jetzt!',
        fr: 'Teste frag.jetzt !',
      },
      description: {
        en: 'Discover our experimental room and immerse yourself in the new world of audience-response systems! Enter the key code »Feedback«. Explore all features of our platform and chat with an AI assistant. Experiment with realistic data and use cases. Share your feedback, ask us your questions.',
        de: 'Entdecke unseren Experimentierraum und tauche ein in die neue Welt der Audience-Response-Systeme! Gib den Raum-Code »Feedback« ein. Erkunde alle Funktionen unserer Plattform und chatte mit einem KI-Assistenten. Experimentiere mit realistischen Daten und Use Cases. Teile dein Feedback, stelle uns deine Fragen.',
        fr: "Découvre notre salle d'expérimentation et plonge-toi dans le monde novateur des systèmes de réponse de l'auditoire! Saisis le code de salle « Feedback ». Explore toutes les fonctionnalités de notre plateforme et chatte avec un assistant IA. Expérimente avec des données réalistes et des cas d'utilisation. Partage tes commentaires, pose-nous tes questions.",
      },
      image: {
        url: '/assets/background/test-tubes.svg',
      },
    },
    window: _1x1windowSize,
  },
  // Card 19: Price?
  {
    content: {
      title: {
        en: 'Price?',
        de: 'Der Preis?',
        fr: 'Le Prix ?',
      },
      description: {
        en: 'frag.jetzt is open source and offered as a free software-as-a-service. You can use DeepSeek-R1 for free. Teachers participating in our study receive exclusive access to OpenAI. If you prefer, you can use your own API key instead or deactivate AI entirely.',
        de: 'frag.jetzt ist Open Source und wird als kostenlose Software-as-a-Service angeboten. Du kannst DeepSeek-R1 kostenlos nutzen. Lehrkräfte, die an unserer Studie teilnehmen, erhalten exklusiven Zugang zu OpenAI. Alternativ kannst du deinen eigenen API-Key nutzen oder die KI-Funktionen deaktivieren.',
        fr: "frag.jetzt est open source et proposé comme un logiciel libre en tant que service. Tu peux utiliser DeepSeek-R1 gratuitement. Les enseignants participant à notre étude bénéficient d'un accès exclusif à OpenAI. Sinon, tu peux utiliser ta propre clé API ou désactiver les fonctions d'IA.",
      },
      image: {
        url: '/assets/background/dollars.svg',
      },
    },
    window: _1x1windowSize,
  },
  // Card 20: All inclusive
  {
    content: {
      title: {
        en: 'All inclusive',
        de: 'All inclusive',
        fr: 'Tout compris',
      },
      description: {
        en: "On our platform, you'll find everything you need: learning rooms, coaching zones, discussion forums, and so much more. Are you a teacher? Perfect! Distribute the key code in your course. Are you a student looking for a digital room just for you? We've got that too. Quantity and size of the rooms? Unlimited! Welcome to us! Digital, flexible, all inclusive.",
        de: 'Auf unserer Plattform findest du alles, was du brauchst: Lernräume, Coaching-Zonen, Diskussionsforen und vieles mehr. Du bist Lehrkraft? Perfekt! Teile den Raum-Code in deinem Kurs. Du studierst und suchst nach einem digitalen Raum nur für dich? Das geht auch. Anzahl und Größe der Räume? Unbegrenzt! Willkommen bei uns! Digital, flexibel, all inclusive.',
        fr: "Sur notre plateforme, tu trouveras tout ce dont tu as besoin : des salles d'étude, des zones de coaching, des forums de discussion, et bien plus encore. Tu es enseignant ? Parfait ! Partage le code de salle dans ton cours. Tu es étudiant à la recherche d'une salle numérique juste pour toi ? Nous avons ça aussi. Quantité et taille des salles ? Illimitées ! Bienvenue chez nous ! Numérique, flexible, tous compris.",
      },
      image: {
        url: '/assets/background/all-inclusive.svg',
      },
    },
    window: _1x1windowSize,
  },
  // Card 21: GDPR
  {
    content: {
      title: {
        en: 'GDPR',
        de: 'DSGVO',
        fr: 'RGPD',
      },
      description: {
        en: 'frag.jetzt fully complies with the EU General Data Protection Regulation. It ensures that your personal data is protected and treated confidentially. Our app is securely and reliably hosted in Germany. Please note that the use of AI assistance may require acceptance of additional privacy policies from third-party providers.',
        de: 'frag.jetzt steht voll und ganz im Einklang mit der EU-Datenschutz-Grundverordnung. Sie garantiert, dass deine persönlichen Daten geschützt und vertraulich behandelt werden. Unsere App wird sicher und zuverlässig in Deutschland gehostet. Beachte: Die Nutzung von KI-Assistenzsystemen kann die Zustimmung zu zusätzlichen Datenschutzrichtlinien externer Anbieter erfordern.',
        fr: "frag.jetzt est en parfaite conformité avec le Règlement Général sur la Protection des Données de l'UE. Il garantit que tes données personnelles sont protégées et traitées de manière confidentielle. Notre application est hébergée de manière sécurisée et fiable en Allemagne. Note que l'utilisation des assistants IA peut nécessiter l'acceptation de politiques de confidentialité supplémentaires de fournisseurs tiers.",
      },
      image: {
        url: '/assets/background/europa.svg',
      },
    },
    window: _1x1windowSize,
  },
  // Card 22: Start Now!
  {
    content: {
      title: {
        en: 'Start Now!',
        de: 'Starte jetzt!',
        fr: 'Démarre maintenant !',
      },
      description: {
        en: "Create a room, share the key code. It's that easy! No registration, completely anonymous. If you want to use your AI assistants in any browser on any device, set up a free frag.jetzt account: Click on »Sign in« in the top right corner. Don't hold back, try everything out!",
        de: 'Raum erstellen, Raum-Code teilen. So einfach geht’s! Ohne Registrierung, völlig anonym. Wenn du deine KI-Assistenten in jedem Browser auf jedem Gerät einsetzen willst, richte dir ein kostenloses frag.jetzt-Konto ein: Klick oben rechts auf »Anmelden«. Hab keine Hemmungen, probier alles aus!',
        fr: "Si tu veux utiliser tes assistants IA dans n'importe quel navigateur sur n'importe quel appareil, crée un compte frag.jetzt gratuit : Il suffit de cliquer sur « Se connecter » en haut à droite. Ne te retiens pas, essaie tout !",
      },
      image: {
        url: '/assets/background/rocket.svg',
      },
    },
    window: _1x1windowSize,
  },
];
