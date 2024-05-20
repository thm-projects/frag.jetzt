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
  [M3WindowSizeClass.QHD]: {
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
        url: '/assets/background/chat_bot_green.svg',
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
      [M3WindowSizeClass.QHD]: {
        colspan: 2,
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
      [M3WindowSizeClass.QHD]: {
        colspan: 2,
        rowspan: 1,
      },
    },
  },
  {
    content: {
      title: {
        en: 'AI StudyBuddy',
        de: 'KI StudyBuddy',
        fr: 'StudyBuddy IA',
      },
      description: {
        en: "Take part in our study »AI assistants in teaching & studying«. Get unlimited access to the latest language models in all your rooms. Share your students' feedback with us: Are AI assistants the future? Contact us via the imprint.",
        de: 'Nimm an unserer Studie »KI-Assistenten in Lehre & Studium« teil. Erhalte uneingeschränkten Zugang zu den neuesten Sprachmodellen in all deinen Räumen. Teile uns das Feedback deiner Studierenden mit: Sind KI-Assistenten die Zukunft? Kontaktiere uns über das Impressum.',
        fr: "Participe à notre étude « Les assistants IA dans l'enseignement et l'étude ». Bénéficie d'un accès illimité aux derniers modèles linguistiques dans toutes tes salles. Partage avec nous les retours d'expérience de tes élèves : Les assistants IA sont-ils l'avenir ? Contacte-nous via les mentions légales.",
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
      [M3WindowSizeClass.QHD]: {
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
      [M3WindowSizeClass.QHD]: {
        colspan: 2,
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
        en: "The AI assistant helps you to overcome your writer's block. It supports you in formulating your thoughts, creates outlines and revises your texts. It organizes your writing process. Since code is basically just text, the chatbot can generate code, find errors or explain code. So use the AI whenever you need a writing aid.",
        de: 'Der KI-Assistent hilft dir, deine Schreibblockade zu überwinden. Er unterstützt dich bei der Formulierung deiner Gedanken, erstellt Gliederungen und überarbeitet deine Texte. Er organisiert deinen Schreibprozess. Da Code im Grunde nur Text ist, kann der Chatbot Code generieren, Fehler finden oder Code erklären. Nutze also die KI, wann immer du eine Schreibhilfe brauchst.',
        fr: "L'assistant IA t'aide à surmonter ton syndrome de la page blanche. Il te soutient dans la formulation de tes pensées, crée des plans et révise tes textes. Il organise ton processus d'écriture. Comme le code n'est à la base que du texte, le chatbot peut générer du code, trouver des erreurs ou expliquer du code. Utilise donc l'IA chaque fois que tu as besoin d'une aide à la rédaction.",
      },
      image: {
        url: '/assets/background/keyboard.png',
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
      [M3WindowSizeClass.QHD]: {
        colspan: 2,
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
        en: "The AI summarizes the chapters of your script, extracts learning objectives and concepts and generates a glossary of technical terms. It creates exercises and exam questions from your lecture slides and evaluates submissions and answers. It answers all your students' questions 24/7: always competently and in line with your target group.",
        de: 'Die KI fasst die Kapitel deines Skripts zusammen, extrahiert Lernziele und Konzepte und erstellt ein Glossar mit Fachbegriffen. Sie erstellt Übungen und Prüfungsfragen aus deinen Vorlesungsfolien und wertet Einsendungen und Antworten aus. Sie beantwortet alle Fragen deiner Schüler/innen 24/7: immer kompetent und zielgruppengerecht.',
        fr: "L'IA résume les chapitres de ton script, extrait les objectifs et les concepts d'apprentissage et génère un glossaire de termes techniques. Elle crée des exercices et des questions d'examen à partir de tes diapositives de cours et évalue les soumissions et les réponses. Elle répond à toutes les questions de tes élèves 24 heures sur 24 et 7 jours sur 7 : toujours avec compétence et en fonction de ton groupe cible.",
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
        en: 'Performance',
        de: 'Performance',
        fr: 'Performance',
      },
      description: {
        en: 'Free yourself from the traffic on the OpenAI website! We directly query the OpenAI API. Regardless of the time of day or night, or whether half the world is currently chatting with ChatGPT, the bot always responds quickly and reliably!',
        de: 'Mach dich unabhängig vom Traffic auf der OpenAI-Website! Wir befragen direkt die OpenAI-API. Egal zu welcher Tages- oder Nachtzeit oder ob die halbe Welt gerade mit ChatGPT chattet, der Bot reagiert stets prompt und zuverlässig!',
        fr: "Libère-toi du trafic sur le site web d'OpenAI ! Nous utilisons directement l'API OpenAI. Peu importe l'heure du jour ou de la nuit, ou que la moitié du monde soit en train de discuter avec ChatGPT, le bot répond toujours rapidement et de manière fiable !",
      },
      image: {
        url: '/assets/background/porsche.svg',
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
        rowspan: 1,
      },
      [M3WindowSizeClass.QHD]: {
        colspan: 3,
        rowspan: 2,
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
        en: 'frag.jetzt vs. ARSnova',
        de: 'frag.jetzt vs. ARSnova',
        fr: 'frag.jetzt vs. ARSnova',
      },
      description: {
        en: 'frag.jetzt is the new ARSnova and is a novelty among audience response systems in three respects: First, everyone can rate all questions to signal a collective interest in answering them. Second, tutors can rate the quality of posts: whether they are correct, incorrect or particularly good. And finally, an AI assistant can provide individualized feedback and patiently answer all comprehension questions.',
        de: 'frag.jetzt ist das neue ARSnova und stellt in dreierlei Hinsicht ein Novum unter den Audience-Response-Systemen dar: Erstens kann jeder alle Fragen bewerten, um ein kollektives Interesse an deren Beantwortung zu signalisieren. Zweitens können Tutoren die Qualität der Beiträge bewerten: ob sie richtig, falsch oder besonders gut sind. Und schließlich kann ein KI-Assistent individuelles Feedback geben und geduldig alle Verständnisfragen beantworten.',
        fr: "frag.jetzt est la nouvelle ARSnova et constitue une nouveauté parmi les systèmes de réponse du public à trois égards : Premièrement, tout le monde peut noter toutes les questions pour signaler un intérêt collectif à y répondre. Deuxièmement, les tuteurs peuvent évaluer la qualité des messages : s'ils sont corrects, incorrects ou particulièrement bons. Et enfin, un assistant IA peut fournir des commentaires individualisés et répondre patiemment à toutes les questions de compréhension.",
      },
      image: {
        url: '/assets/background/supernova.svg',
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
      [M3WindowSizeClass.QHD]: {
        colspan: 1,
        rowspan: 1,
      },
    },
  },
  {
    content: {
      title: {
        en: 'Moderation',
        de: 'Moderation',
        fr: 'Modération',
      },
      description: {
        en: "Want to review posts before they are published? Use our moderation feature. Or set it to automated: Define a threshold for negative ratings, beyond which posts are moved to moderation. This way, the group can co-decide what content belongs in the forum and what doesn't.",
        de: 'Du möchtest Beiträge vor ihrer Veröffentlichung prüfen? Dann nutze unsere Moderationsfunktion. Oder automatisiert: Lege eine Schwelle für negative Bewertungen fest, ab der Beiträge in die Moderation verschoben werden. So kann die Gruppe mitentscheiden, welche Inhalte ins Forum gehören und welche nicht.',
        fr: "Veux-tu vérifier les posts avant qu'ils ne soient publiés ? Utilise notre fonction de modération. Ou en automatique : fixe un seuil pour les évaluations négatives, au-delà duquel les posts sont déplacés vers la modération. Ainsi, le groupe peut co-décider du contenu qui appartient au forum et celui qui n'y appartient pas.",
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
        en: 'Create questions and assign them »labels«. This way, you can categorize your questions. Click on a label and only questions with this label will be displayed. For example, in a panel discussion, you could use labels such as »Question for Mr. Scholz« or »Question for Ms. Baerbock« to bundle the questions from the audience',
        de: 'Erstelle Fragen und gib ihnen »Labels«. So kannst du deine Fragen kategorisieren. Ein Klick auf ein Label und nur Fragen mit diesem Label werden angezeigt. Zum Beispiel könntest du in einer Podiumsdiskussion Labels wie »Frage an Herrn Scholz« oder »Frage an Frau Baerbock« verwenden, um die Fragen aus dem Publikum zu bündeln.',
        fr: "Crée des questions et attribue-leur des « labels ». Ainsi, tu peux catégoriser tes questions. Clique sur un label et seules les questions avec ce label seront affichées. Par exemple, lors d'un débat, tu pourrais utiliser des labels tels que « Question pour M. Scholz » ou « Question pour Mme Baerbock » pour grouper les questions du public.",
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
      [M3WindowSizeClass.QHD]: {
        colspan: 1,
        rowspan: 1,
      },
    },
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
        colspan: 2,
        rowspan: 2,
      },
      [M3WindowSizeClass.QHD]: {
        colspan: 3,
        rowspan: 3,
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
      [M3WindowSizeClass.QHD]: {
        colspan: 2,
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
      [M3WindowSizeClass.QHD]: {
        colspan: 2,
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
        en: 'Navigation',
        de: 'Navigation',
        fr: 'Navigation',
      },
      description: {
        en: "Are you looking for the manual? Don't worry, you don't need one. There are only two menus: the navigation on the top left and the options on the top right. The navigation gives you access to the features of the platform. You can find the functions of each feature in the options menu. It couldn't be simpler.",
        de: 'Suchst du das Handbuch? Keine Sorge, du brauchst keins. Es gibt nur zwei Menüs: Die Navigation oben links und die Optionen oben rechts. Über die Navigation erhältst du Zugriff auf die Features der Plattform. Die Funktionen jedes Features findest du im Optionsmenü. Einfacher geht’s nicht.',
        fr: "Tu cherches le manuel ? Ne t'inquiète pas, tu n'en as pas besoin. Il n'y a que deux menus : la navigation en haut à gauche et les options en haut à droite. La navigation te donne accès aux fonctionnalités de la plateforme. Tu peux trouver les fonctions de chaque fonctionnalité dans le menu des options. Cela ne pourrait pas être plus simple.",
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
        en: 'Quota Management',
        de: 'Quota-Management',
        fr: 'Gestion des quotas',
      },
      description: {
        en: 'Optimize the costs for AI. Use our quota management for token limits by room, month, day, time period and user role. Take part in our study as a teacher and receive a monthly bonus of 20 dollars. You can generate tens of millions of words.',
        de: 'Optimiere die Kosten für KI. Nutze unser Kontingentmanagement für Token-Limits nach Raum, Monat, Tag, Zeitspanne und Benutzerrolle. Nimm als Lehrkraft an unserer Studie teil und erhalte einen monatlichen Bonus von 20 Dollar. Damit kannst du zig Millionen Wörter generieren.',
        fr: "Optimise les coûts pour l'IA. Utilise notre gestion des quotas pour les limites de jetons par salle, par mois, par jour, par période et par rôle d'utilisateur. Participe à notre étude en tant qu'enseignant et reçois un bonus mensuel de 20 dollars. Tu peux générer des dizaines de millions de mots.",
      },
      image: {
        url: '/assets/background/traffic-light.svg',
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
      [M3WindowSizeClass.QHD]: {
        colspan: 1,
        rowspan: 1,
      },
    },
  },
  {
    content: {
      title: {
        en: 'Price? Nothing.',
        de: 'Der Preis? Nichts.',
        fr: 'Le Prix ? Rien.',
      },
      description: {
        en: "frag.jetzt is open source and offered as a free software-as-a-service. Each room has a ChatGPT credit of 5 dollars or even 20 dollars if you participate in our study as a teacher. In return, the chatbot generates tens of millions of words! If that's not enough, you can continue with your own API key.",
        de: 'frag.jetzt ist Open Source und wird als kostenlose Software-as-a-Service angeboten. Für jeden Raum gibt es ein ChatGPT-Guthaben von 5 Dollar oder sogar 20 Dollar, wenn du als Lehrkraft an unserer Studie teilnimmst. Im Gegenzug generiert der Chatbot zig Millionen Wörter! Wenn dir das nicht reicht, kannst du mit deinem eigenen API- Key weitermachen.',
        fr: "frag.jetzt est open source et proposé comme un logiciel libre en tant que service. Chaque salle dispose d'un crédit ChatGPT de 5 dollars ou même de 20 dollars si tu participes à notre étude en tant qu'enseignant. En retour, le chatbot génère des dizaines de millions de mots ! Si cela ne suffit pas, tu peux continuer avec ta propre clé API.",
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
      [M3WindowSizeClass.QHD]: {
        colspan: 2,
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
        en: "On our platform, you'll find everything you need: learning rooms, coaching zones, discussion forums, chats with others and the AI, and so much more. Are you a teacher? Perfect! Distribute the key code in your course. Are you a student looking for a digital room just for you? We've got that too. Quantity and size of the rooms? Unlimited! Welcome to us! Digital, flexible, all inclusive.",
        de: 'Auf unserer Plattform findest du alles, was du brauchst: Lernräume, Coaching-Zonen, Diskussionsforen, Chats mit anderen und der KI, und vieles mehr. Du bist Lehrkraft? Perfekt! Teile den Raum-Code in deinem Kurs. Du studierst und suchst nach einem digitalen Raum nur für dich? Das geht auch. Anzahl und Größe der Räume? Unbegrenzt! Willkommen bei uns! Digital, flexibel, all inclusive.',
        fr: "Sur notre plateforme, tu trouveras tout ce dont tu as besoin : des salles d'étude, des zones de coaching, des forums de discussion, des chats avec d'autres personnes et l'IA, et bien plus encore. Tu es enseignant ? Parfait ! Partage le code de salle dans ton cours. Tu es étudiant à la recherche d'une salle numérique juste pour toi ? Nous avons ça aussi. Quantité et taille des salles ? Illimitées ! Bienvenue chez nous ! Numérique, flexible, tous compris.",
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
        en: "frag.jetzt fully complies with the EU General Data Protection Regulation. It ensures that your personal data is protected and treated confidentially. Our app is securely and reliably hosted in Germany. Please note that the use of ChatGPT requires acceptance of OpenAI's privacy policy.",
        de: 'frag.jetzt steht voll und ganz im Einklang mit der EU-Datenschutz-Grundverordnung. Sie garantiert, dass deine persönlichen Daten geschützt und vertraulich behandelt werden. Unsere App wird sicher und zuverlässig in Deutschland gehostet. Beachte: Die Nutzung von ChatGPT erfordert die Annahme der Datenschutzerklärung von OpenAI.',
        fr: "frag.jetzt est en parfaite conformité avec le Règlement Général sur la Protection des Données de l'UE. Il garantit que tes données personnelles sont protégées et traitées de manière confidentielle. Notre application est hébergée de manière sécurisée et fiable en Allemagne. Note que l'utilisation de ChatGPT nécessite l'acceptation de la politique de confidentialité d'OpenAI.",
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
