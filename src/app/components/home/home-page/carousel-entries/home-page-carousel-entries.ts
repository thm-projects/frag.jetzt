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
};

export const homePageCarouselEntries: HomePageCarouselEntry[] = [
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
        url: '/assets/background/chat_bot_green.svg',
      },
    },
    window: {
      [M3WindowSizeClass.Expanded]: {
        colspan: 1,
        rowspan: 1,
      },
      [M3WindowSizeClass.Large]: {
        colspan: 2,
        rowspan: 1,
      },
      [M3WindowSizeClass.ExtraLarge]: {
        colspan: 2,
        rowspan: 1,
      },
    },
  },
  {
    content: {
      title: {
        en: 'Prompting',
        de: 'Prompting',
        fr: 'Prompting',
      },
      description: {
        en: 'You can set the context for the users of your room and the role you want ChatGPT to take. Also, the format and scope of the responses. With keywords, you limit the chat to the topic of your event. The bot will reject inappropriate or unwanted questions in a friendly but firm way.',
        de: 'Du kannst für die User deines Raumes den Kontext festlegen und die Rolle, die ChatGPT einnehmen soll. Auch das Format und den Umfang der Antworten. Mit Schlüsselwörtern begrenzt du den Chat auf das Thema deiner Veranstaltung. Unpassende oder unerwünschte Fragen lehnt der Bot freundlich, aber bestimmt ab.',
        fr: "Tu peux définir pour les utilisateurs de ta salle le contexte et le rôle que ChatGPT doit jouer. De même que le format et l'étendue des réponses. Avec des mots-clés, tu limites le chat au thème de ton événement. Le bot refuse gentiment, mais fermement les questions inappropriées ou indésirables.",
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
        colspan: 2,
        rowspan: 1,
      },
      [M3WindowSizeClass.ExtraLarge]: {
        colspan: 2,
        rowspan: 1,
      },
    },
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
    window: _1x1windowSize,
  },
  {
    content: {
      title: {
        en: 'AI StudyBuddy',
        de: 'KI StudyBuddy',
        fr: 'StudyBuddy IA',
      },
      description: {
        en: 'Participate in our study »ChatGPT in Teaching & Learning«. Gain unlimited access to the AI-Tutor in all your rooms. Share feedback from your students with us: Are AI tutors the future? Contact us via the legal notice.',
        de: 'Mach mit bei unserer Studie »ChatGPT in Lehre & Studium«. Erhalte unbegrenzten Zugang zum KI-Tutor in allen deinen Räumen. Teile uns das Feedback deiner Studierenden mit: Sind KI-Tutoren die Zukunft? Kontaktiere uns über das Impressum.',
        fr: "Participe à notre étude « ChatGPT dans l'Enseignement & l'Apprentissage ». Bénéficie d'un accès illimité au Tuteur AI dans toutes tes salles. Partage avec nous les retours de tes étudiants : Les tuteurs IA sont-ils l'avenir ? Contacte-nous via les mentions légales.",
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
        colspan: 2,
        rowspan: 2,
      },
      [M3WindowSizeClass.ExtraLarge]: {
        colspan: 2,
        rowspan: 2,
      },
    },
  },
  {
    content: {
      title: {
        en: 'Teach with AI!',
        de: 'Lehre mit KI!',
        fr: "Enseigne avec l'IA !",
      },
      description: {
        en: "ChatGPT summarizes the chapters of your script, isolates learning objectives and key concepts, and generates a glossary of  technical terms. The AI creates exercises and exam questions from your lecture slides and grades submissions and answers. It answers all your students' questions 24/7: competently and in line with the target group.",
        de: 'ChatGPT fasst die Kapitel deines Skripts zusammen, extrahiert Lernziele und Konzepte und generiert ein Glossar mit den Fachbegriffen. Die KI erstellt aus deinen Vorlesungsfolien Übungsaufgaben und Prüfungsfragen, bewertet Einreichungen und Antworten. Sie beantwortet 24/7 alle Fragen deiner Studierenden: stets kompetent und zielgruppengerecht.',
        fr: "ChatGPT résume les chapitres de ton script, isole les objectifs d'apprentissage et les concepts clés, et génère un glossaire de termes techniques. L'IA crée des tâches pratiques et des questions d'examen à partir de tes diapositives de cours, évalue les soumissions et les réponses. Elle répond à toutes les questions de tes étudiants de manière compétente et appropriée à leur niveau, 24 heures sur 24.",
      },
      image: {
        url: '/assets/background/graduation-cap.svg',
      },
    },
    window: _1x1windowSize,
  },
  {
    content: {
      title: {
        en: 'Learn with AI!',
        de: 'Lerne mit KI!',
        fr: "Apprends avec l'IA !",
      },
      description: {
        en: 'Create your own rooms: one room per module. Ask ChatGPT questions about your lectures and save the answers in the Q&A forum. Feed the bot your notes and let it create study materials: from flashcards to exam questions. Get quizzed by ChatGPT before the exam: face the quiz duel with the AI!',
        de: 'Erstelle eigene Räume: pro Modul einen eigenen Raum. Stelle ChatGPT Fragen zu deinen Vorlesungen und speichere die Antworten im Q&A-Forum. Gib dem Bot deine Mitschrift und lass ihn daraus Lernmaterialien generieren: von Lernkarten bis zu Prüfungsfragen. Lass dich vor der Prüfung von ChatGPT abfragen: Stell dich dem Quiz-Duell mit der KI!',
        fr: "Crée tes propres salles : une salle par module. Pose des questions à ChatGPT sur tes cours et sauvegarde les réponses dans le forum Q&R. Donne au bot tes notes et laisse-le créer des supports d'étude : des flashcards aux questions d'examens. Laisse-toi interroger par ChatGPT avant de passer l'examen : affronte l'IA dans un duel de quiz !",
      },
      image: {
        url: '/assets/background/books.svg',
      },
    },
    window: _1x1windowSize,
  },
  {
    content: {
      title: {
        en: 'Write with AI!',
        de: 'Schreibe mit KI!',
        fr: "Écris avec l'IA !",
      },
      description: {
        en: "Use ChatGPT as your writing assistant! The AI helps you overcome writer's block. It supports you in formulating your thoughts, creates outlines, and revises your texts. It assists you in creating project and work plans, in defining goals, prioritizing tasks, and developing schedules. Since code is essentially just text, ChatGPT can generate code, find errors, or explain code. So use ChatGPT whenever you need writing help.",
        de: 'Nutze ChatGPT als Schreibassistenten! Die KI hilft dir, Schreibblockaden zu überwinden. Sie unterstützt dich beim Formulieren deiner Gedanken, erstellt Gliederungen und überarbeitet deine Texte. Sie organisiert deinen Schreibprozess: Sie assistiert dir beim Erstellen von Projekt- und Arbeitsplänen, beim Definieren von Zielen, Priorisieren von Aufgaben und Ausarbeiten von Zeitplänen. Da Code im Grunde genommen auch nur Text ist, kann ChatGPT Code generieren, Fehler finden oder Code erklären. Nutze also ChatGPT, wann immer du eine Schreibhilfe brauchst.',
        fr: "Utilise ChatGPT comme assistant d'écriture ! L'IA t'aide à surmonter le blocage de l'écrivain. Elle te soutient dans la formulation de tes pensées, crée des plans et révise tes textes. Elle t'assiste dans la création de plans de projet et de travail, dans la définition des objectifs, la priorisation des tâches et l'élaboration des calendriers. Puisque le code n'est fondamentalement que du texte, ChatGPT peut générer du code, trouver des erreurs ou expliquer du code. Alors utilise ChatGPT chaque fois que tu as besoin d'aide pour écrire.",
      },
      image: {
        url: '/assets/background/paper.svg',
      },
    },
    window: _1x1windowSize,
  },
  {
    content: {
      title: {
        en: 'ARSnova 2.0',
        de: 'ARSnova 2.0',
        fr: 'ARSnova 2.0',
      },
      description: {
        en: 'frag.jetzt is the new ARSnova and a novelty among audience response systems in three respects: 1. everyone can rate all questions to signal a collective interest in answering them. 2. tutors can rate the quality of the posts: right, wrong or especially good. And 3. ChatGPT can provide individualized feedback as an AI tutor and patiently answer all comprehension questions.',
        de: 'frag.jetzt ist das neue ARSnova und in drei Punkten ein Novum unter den Audience Response Systemen: 1. Alle können alle Fragen bewerten, um ein kollektives Interesse an der Beantwortung zu signalisieren. 2. Tutor*innen können die Qualität der Posts bewerten: ob richtig, falsch oder besonders gut. Und 3. kann ChatGPT als KI-Tutor individualisiertes Feedback geben und alle Verständnisfragen geduldig beantworten.',
        fr: "frag.jetzt est le nouvel ARSnova et constitue une nouveauté parmi les systèmes de réponse de l'audience sur trois points : 1. tout le monde peut évaluer toutes les questions afin de signaler un intérêt collectif à y répondre. 2. les tuteurs peuvent évaluer la qualité des posts : s'ils sont corrects, incorrects ou particulièrement bons. Et 3. ChatGPT peut, en tant que tuteur IA, donner un feedback individualisé et répondre patiemment à toutes les questions de compréhension.",
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
        colspan: 2,
        rowspan: 1,
      },
      [M3WindowSizeClass.ExtraLarge]: {
        colspan: 2,
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
        colspan: 2,
        rowspan: 2,
      },
      [M3WindowSizeClass.ExtraLarge]: {
        colspan: 2,
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
    window: _1x1windowSize,
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
    window: _1x1windowSize,
  },
  {
    content: {
      title: {
        en: 'Peer Instruction',
        de: 'Peer Instruction',
        fr: 'Peer Instruction',
      },
      description: {
        en: 'Get a detailed description of the evidence-based teaching method Peer Instruction from ChatGPT. frag.jetzt supports you in using the method. Students answer concept questions and discuss their answers with their seatmates. They argue their answers and develop a deeper understanding of the subject. With our app, you can make Peer Instruction an integral part of your lecture!',
        de: 'Lass dir von ChatGPT die evidenzbasierte Lehrmethode Peer Instruction erläutern. frag.jetzt unterstützt dich bei der Anwendung: Studierende beantworten Konzeptfragen und diskutieren ihre Antworten mit ihren Sitznachbarn. Sie argumentieren ihre Antworten und entwickeln so ein tieferes Verständnis des Stoffes. Mit unserer App machst du Peer Instruction zum festen Bestandteil deiner Vorlesung!',
        fr: "Demande à ChatGPT de t'expliquer la méthode d'enseignement basée sur les preuves « Peer Instruction ». frag.jetzt t'aide à l'appliquer : Les étudiants répondent à des questions conceptuelles et discutent de leurs réponses avec leurs voisins de siège. Ils argumentent leurs réponses et développent ainsi une compréhension plus approfondie de la matière. Avec notre application, tu fais de la Peer Instruction une partie intégrante de ton enseignement !",
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
        en: 'Discover our experimental room and immerse yourself in the new world of audience-response systems! Enter the key code »Feedback«. Explore all features of our platform and chat with ChatGPT, your personal AI tutor. Experiment with realistic data and use cases. Share your feedback, ask us your questions.',
        de: 'Entdecke unseren Experimentierraum und tauche ein in die neue Welt der Audience-Response-Systeme! Gib den Raum-Code »Feedback« ein. Erkunde alle Funktionen unserer Plattform und chatte mit ChatGPT, deinem persönlichen KI-Tutor. Experimentiere mit realistischen Daten und Use Cases. Teile dein Feedback, stelle uns deine Fragen.',
        fr: "Découvre notre salle d'expérimentation et plonge-toi dans le monde novateur des systèmes de réponse de l'auditoire! Saisis le code de salle « Feedback ». Explore toutes les fonctionnalités de notre plateforme et chatte avec ChatGPT, ton tuteur AI personnel. Expérimente avec des données réalistes et des cas d'utilisation. Partage tes commentaires, pose-nous tes questions.",
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
        en: 'Progressive App',
        de: 'Progressive App',
        fr: 'App Progressive',
      },
      description: {
        en: "Imagine an app that requires no downloads or updates, adapts perfectly to any device, and can even be installed on your laptop. That's frag.jetzt, our Progressive Web App (PWA). Install it directly on your home screen and always enjoy the latest version. Smart, simple, forward-thinking.",
        de: 'Stell dir eine App vor, die keine Downloads oder Updates benötigt, sich perfekt an jedes Gerät anpasst und sogar auf deinem Laptop installiert werden kann. Das ist frag.jetzt, unsere Progressive Web App (PWA). Installiere sie direkt auf deinem Startbildschirm und genieße immer die aktuellste Version. Smart, einfach, zukunftsorientiert.',
        fr: "Imagine une application qui ne nécessite aucun téléchargement ou mise à jour, qui s'adapte parfaitement à n'importe quel appareil et qui peut même être installée sur ton laptop. C'est frag.jetzt, notre application Web progressive (PWA). Installe-la directement sur ton écran d'accueil et profite toujours de la dernière version. Intelligent, simple, tourné vers l'avenir.",
      },
      image: {
        url: '/assets/background/PWA.svg',
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
        en: 'Learn more …',
        de: 'Mehr erfahren …',
        fr: 'En savoir plus …',
      },
      description: {
        en: "Nice that you've made it this far! Take a look at the footer on the left. There you will find lots of useful information and tips. It's worth it! Start your journey of discovery now!",
        de: 'Schön, dass du bis hierher gekommen bist! Schau mal links in die Fußzeile. Dort findest du viele nützliche Informationen und Tipps. Es lohnt sich! Geh jetzt auf Entdeckungsreise!',
        fr: "C'est bien que tu sois arrivé jusqu'ici ! Regarde dans le pied de page à gauche. Là, tu trouveras beaucoup d'informations utiles et des astuces. Ça vaut le coup ! Commence ton voyage de découverte maintenant !",
      },
      image: {
        url: '/assets/background/info.svg',
      },
    },
    window: _1x1windowSize,
  },
  {
    content: {
      title: {
        en: 'Price? Nothing.',
        de: 'Der Preis? Nichts.',
        fr: 'Le Prix ? Rien.',
      },
      description: {
        en: "frag.jetzt is open source and offered as a free software-as-a-service. Each room has a ChatGPT credit: $5 from OpenAI or $20 from us if you participate in our study. In exchange, the chatbot generates millions of words! If that's not enough, you can continue with your own API key from OpenAI.",
        de: 'frag.jetzt ist Open Source und wird als kostenloser Software-as-a-Service angeboten. Jeder Raum hat ein ChatGPT-Guthaben: 5 Dollar von OpenAI oder 20 Dollar von uns, wenn du an unserer Studie teilnimmst. Dafür generiert der Chatbot Millionen von Wörtern! Wenn das nicht genug ist, kannst du mit deinem eigenen API-Key von OpenAI weitermachen.',
        fr: "frag.jetzt est open source et offert comme un logiciel en tant que service gratuit. Chaque salle a un crédit ChatGPT : 5 $ de la part de OpenAI ou 20 $ de notre part si tu participes à notre étude. En échange, le chatbot génère des millions de mots ! Si ce n'est pas suffisant, tu peux continuer avec ta propre clé API de OpenAI.",
      },
      image: {
        url: '/assets/background/dollars.svg',
      },
    },
    window: _1x1windowSize,
  },
  {
    content: {
      title: {
        en: 'Token credit',
        de: 'Token-Guthaben',
        fr: 'Crédit en tokens',
      },
      description: {
        en: 'Optimize the cost of the OpenAI API by using GPT-3.5 Turbo (1,000,000 words per dollar) instead of GPT-4 Turbo (75,000 words per dollar). Use our quota management for token limits by room, month, day, time span, and user role. Take advantage of the OpenAI credit ($5 for three months). Participate as a teacher in our study and receive a $20 monthly bonus. Review and adjust your quota settings to use your credit efficiently.',
        de: 'Optimiere die Kosten der OpenAI-API, indem du GPT-3.5 Turbo (1.000.000 Wörter pro Dollar) anstelle von GPT-4 Turbo (75.000 Wörter pro Dollar) verwendest. Nutze unsere Kontingentverwaltung für Token-Limits nach Raum, Monat, Tag, Zeitspanne und Benutzerrolle. Nutze das OpenAI-Guthaben (5 Dollar für drei Monate). Nimm als Lehrkraft an unserer Studie teil und erhalte einen monatlichen Bonus von 20 Dollar. Überprüfe deine Quota-Einstellungen und passe sie an, um dein Guthaben effizient zu nutzen.',
        fr: "Optimise les coûts de l'API OpenAI en utilisant GPT-3.5 Turbo (1.000.000 mots par dollar) au lieu de GPT-4 Turbo (75.000 mots par dollar). Utilise notre gestion des quotas pour les limites de tokens par salle, mois, jour, période et rôle d'utilisateur. Utilise le crédit OpenAI (5 dollars pour trois mois). Participe à notre étude en tant qu'enseignant et reçois un bonus mensuel de 20 dollars. Vérifie tes paramètres de quotas et ajuste-les pour utiliser efficacement ton crédit",
      },
      image: {
        url: '/assets/background/traffic-light.svg',
      },
    },
    window: _1x1windowSize,
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
        en: 'Start Now!',
        de: 'Starte jetzt!',
        fr: 'Démarre maintenant !',
      },
      description: {
        en: "Create a room, share the key code. It's that easy! No registration, completely anonymous. If you want to use ChatGPT in any browser, on any device, set up a free account: Click on »Sign in« in the top right corner. Don't hold back, try everything out!",
        de: "Raum erstellen, Raum-Code teilen. So einfach geht's! Ohne Registrierung, völlig anonym. Wenn du ChatGPT in jedem Browser auf jedem Gerät einsetzen willst, richte dir ein kostenloses Konto ein: Klick oben rechts auf »Anmelden«. Hab keine Hemmungen, probier alles aus!",
        fr: "Crée une salle, distribue le code de la salle. C'est si simple ! Pas d'inscription, complètement anonyme. Si tu veux utiliser ChatGPT dans n'importe quel navigateur, sur n'importe quel appareil, crée un compte gratuit : Il suffit de cliquer sur « Se connecter » en haut à droite. Ne te retiens pas, essaie tout !",
      },
      image: {
        url: '/assets/background/rocket.svg',
      },
    },
    window: _1x1windowSize,
  },
];
