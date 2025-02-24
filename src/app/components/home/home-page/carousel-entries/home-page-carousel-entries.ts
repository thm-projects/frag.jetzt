import { HomePageCarouselEntry } from '../home-page-carousel';
import { M3WindowSizeClass } from '../../../../../modules/m3/components/navigation/m3-navigation-types';

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

export const homePageCarouselEntries: HomePageCarouselEntry[] = [
  {
    content: {
      title: {
        en: 'Q&A Rooms & AI Assistants',
        de: 'Q&A-Räume & KI-Assistenten',
        fr: 'Salles Q&R & Assistants IA',
      },
      description: {
        en: "Let AI assistants answer your knowledge questions. Your prompts, with which you define the topic of a room and your learning objectives, ensure precise and individual answers. A quick fact check, and you've saved yourself hours of work. Experience how AI makes you more efficient!",
        de: 'Lass deine Wissensfragen von KI-Assistenten beantworten. Deine Prompts, mit denen du das Thema eines Raumes und deine Lernziele festlegst, sorgen für präzise und individuelle Antworten. Ein kurzer Faktencheck und du hast dir viele Stunden Arbeit erspart. Erlebe, wie die KI dich effizienter macht!',
        fr: "Laisse les assistants IA répondre à tes questions de connaissances. Tes prompts, avec lesquels tu définis le sujet d'une salle et tes objectifs d'apprentissage, garantissent des réponses précises et individuelles. Une vérification rapide des faits, et tu t'es épargné des heures de travail. Découvre comment l'IA te rend plus efficace !",
      },
      image: {
        svgIcon: 'fj_robot',
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
      [M3WindowSizeClass.UltraLarge]: {
        colspan: 1,
        rowspan: 1,
      },
    },
  },
  {
    content: {
      title: {
        en: 'Teach with AI',
        de: 'Lehre mit KI',
        fr: "Enseigne avec l'IA",
      },
      description: {
        en: 'The AI summarizes the chapters of your script, extracts learning objectives and technical terms. It creates exercises and exam questions from your lecture slides and evaluates submissions and answers. It answers all questions 24/7: always competently and in a way that is appropriate for the target group.',
        de: 'Die KI fasst die Kapitel deines Skripts zusammen, extrahiert Lernziele und Fachbegriffe. Sie erstellt Übungsaufgaben und Prüfungsfragen aus deinen Vorlesungsfolien und wertet Einreichungen und Antworten aus. Sie beantwortet alle Fragen 24/7: stets kompetent und zielgruppengerecht.',
        fr: "L'IA résume les chapitres de ton script, extrait les objectifs d'apprentissage et les termes techniques. Elle crée des exercices et des questions d'examen à partir de tes diapositives de cours et évalue les soumissions et les réponses. Elle répond à toutes les questions 24 heures sur 24 et 7 jours sur 7 : toujours de manière compétente et adaptée au groupe cible.",
      },
      image: {
        url: '/assets/background/teaching.svg',
      },
    },
    window: _1x1windowSize,
  },
  {
    content: {
      title: {
        en: 'AI Assistants',
        de: 'KI-Assistenten',
        fr: 'Assistants IA',
      },
      description: {
        en: 'Take part in our study »AI assistants in teaching & studying«. Get unlimited access to the latest language models in all your rooms. Share your feedback with us: Are AI assistants the future? Contact us via the imprint.',
        de: 'Nimm an unserer Studie »KI-Assistenten in Lehre & Studium« teil. Erhalte uneingeschränkten Zugang zu den neuesten Sprachmodellen in all deinen Räumen. Teile uns dein Feedback mit: Sind KI-Assistenten die Zukunft? Kontaktiere uns über das Impressum.',
        fr: "Participe à notre étude « Les assistants IA dans l'enseignement et l'étude ». Bénéficie d'un accès illimité aux derniers modèles linguistiques dans toutes tes salles. Fais-nous part de tes commentaires : Les assistants IA sont-ils l'avenir ? Contacte-nous via les mentions légales.",
      },
      image: {
        url: '/assets/background/KI-Chatbot-MNI-1024.webp',
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
        colspan: 2,
        rowspan: 2,
      },
      [M3WindowSizeClass.UltraLarge]: {
        colspan: 2,
        rowspan: 2,
      },
    },
  },
  {
    content: {
      title: {
        en: 'Learn with AI',
        de: 'Lerne mit KI',
        fr: "Apprends avec l'IA",
      },
      description: {
        en: 'Create your own rooms: one room per course. Ask the AI questions about your lectures and save the answers in the Q&A forum. Give the AI assistant your transcript and let it generate learning materials from it: from Anki flashcards to exam questions. Be quizzed before the exam: face the quiz duel with the AI!',
        de: 'Erstelle deine eigenen Räume: ein Raum pro Kurs. Stelle der KI Fragen zu deinen Vorlesungen und speichere die Antworten im Q&A-Forum. Gib dem KI-Assistenten deine Mitschrift und lass ihn daraus Lernmaterialien generieren: von Anki-Flashcards bis hin zu Prüfungsfragen. Lass dich vor der Prüfung abfragen: Stell dich dem Quizduell mit der KI!',
        fr: "Crée tes propres salles : une salle par cours. Pose à l'IA des questions sur tes cours et enregistre les réponses dans le forum de questions-réponses. Donne ta transcription à l'assistant IA et laisse-le générer des supports d'apprentissage à partir de celle-ci : des flashcards Anki aux questions d'examen. Sois interrogé avant l'examen : affronte le duel de quiz avec l'IA !",
      },
      image: {
        url: '/assets/background/learning.svg',
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
      [M3WindowSizeClass.UltraLarge]: {
        colspan: 1,
        rowspan: 1,
      },
    },
  },
  {
    content: {
      title: {
        en: 'Write with AI',
        de: 'Schreibe mit KI',
        fr: "Écris avec l'IA",
      },
      description: {
        en: "The AI assistant helps you to overcome your writer's block. It supports you in formulating your thoughts, creates outlines and revises your texts. Since program code is basically just text, the chatbot can generate code, find errors or explain code. So use the AI whenever you need a writing aid.",
        de: 'Der KI-Assistent hilft dir, deine Schreibblockade zu überwinden. Er unterstützt dich bei der Formulierung deiner Gedanken, erstellt Gliederungen und überarbeitet deine Texte. Da Programmcode im Grunde nur Text ist, kann der Chatbot Code generieren, Fehler finden oder Code erklären. Nutze also die KI, wann immer du eine Schreibhilfe brauchst.',
        fr: "L'assistant IA t'aide à surmonter ton syndrome de la page blanche. Il te soutient dans la formulation de tes pensées, crée des plans et révise tes textes. Comme le code du programme n'est à la base que du texte, le chatbot peut générer du code, trouver des erreurs ou expliquer du code. Utilise donc l'IA chaque fois que tu as besoin d'une aide à la rédaction.",
      },
      image: {
        url: '/assets/background/keyboard.webp',
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
      [M3WindowSizeClass.UltraLarge]: {
        colspan: 1,
        rowspan: 1,
      },
    },
  },
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
      [M3WindowSizeClass.UltraLarge]: {
        colspan: 1,
        rowspan: 1,
      },
    },
  },

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
    },
    window: _1x1windowSize,
  },
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
    },
    window: _1x1windowSize,
  },
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
    },
    window: _1x1windowSize,
  },
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
      [M3WindowSizeClass.UltraLarge]: {
        colspan: 1,
        rowspan: 1,
      },
    },
  },
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
    },
    window: _1x1windowSize,
  },
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
      [M3WindowSizeClass.UltraLarge]: {
        colspan: 1,
        rowspan: 1,
      },
    },
  },
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
      [M3WindowSizeClass.UltraLarge]: {
        colspan: 1,
        rowspan: 1,
      },
    },
  },
  {
    content: {
      title: {
        en: 'Brainstorming',
        de: 'Brainstorming',
        fr: 'Brainstorming',
      },
      description: {
        en: 'Stir up the creativity of your group with an interactive brainstorming session! Ask the focus question and visualize all ideas in real-time in a word cloud. Bonus tip: With just one click, ChatGPT generates as many ideas as you need!',
        de: 'Wecke die Kreativität deiner Gruppe! Mit einem Brainstorming wird es gelingen! Stelle die Fokusfrage und visualisiere alle Ideen in Echtzeit in einer Wortwolke. Bonustipp: Mit nur einem Klick generiert ChatGPT beliebig viele Ideen zu jedem Thema!',
        fr: "Réveille la créativité de ton groupe avec un brainstorming interactif  Pose la question de focus et visualise toutes les idées en temps réel dans un nuage de mots. Conseil bonus : Avec un simple clic, ChatGPT génère autant d'idées que tu en as besoin !",
      },
      image: {
        url: '/assets/background/brainstorming.svg',
      },
    },
    window: _1x1windowSize,
  },
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
      [M3WindowSizeClass.UltraLarge]: {
        colspan: 1,
        rowspan: 1,
      },
    },
  },
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
      [M3WindowSizeClass.UltraLarge]: {
        colspan: 1,
        rowspan: 1,
      },
    },
  },
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
