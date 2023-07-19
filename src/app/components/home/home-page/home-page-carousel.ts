interface TranslationEntry {
  en: string;
  de: string;
  fr: string;
}

interface ImageEntry {
  isBackground?: boolean;
  url: string;
  override: {
    [theme: string]: {
      [cssProperty: string]: any;
    };
  };
}

export const carousel: {
  title: TranslationEntry;
  description: TranslationEntry;
  images: ImageEntry[];
}[] = [
  {
    title: {
      en: 'Q&A with ChatGPT',
      de: 'Q&A mit ChatGPT',
      fr: 'Q&R avec ChatGPT',
    },
    description: {
      en: "Let ChatGPT answer all your knowledge questions. Your prompt presets for your rooms on frag.jetzt ensure precise and personalized answers. A quick fact check, and you've saved yourself hours of work. Experience how AI makes you more efficient!",
      de: 'Lass ChatGPT alle Wissensfragen beantworten. Deine Prompt-Vorgaben für deine Räume auf frag.jetzt sorgen für präzise und personalisierte Antworten. Ein kurzer Faktencheck und du hast dir viele Stunden Arbeit erspart. Erlebe, wie die KI dich effizienter macht!',
      fr: "Laisse ChatGPT répondre à toutes les questions de connaissance. Tes directives de prompt pour tes salles sur frag.jetzt garantissent des réponses précises et personnalisées. Une vérification rapide des faits et tu t'es épargné de nombreuses heures de travail. Découvre comment l'IA te rend plus efficace !",
    },
    images: [
      {
        url: 'url("/assets/background/chat_bot_green.svg")',
        override: {
          default: {
            backgroundSize: '80%',
          },
        },
      },
    ],
  },
  {
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
    images: [
      {
        url: 'url("/assets/background/prompting.svg")',
        override: {
          default: {
            backgroundSize: '60%',
          },
        },
      },
    ],
  },
  {
    title: {
      en: 'Performance',
      de: 'Performance',
      fr: 'Performance',
    },
    description: {
      en: 'Free yourself from the traffic on the OpenAI website! We directly query the GPT-4 API. Regardless of the time of day or night, or whether half the world is currently chatting with ChatGPT, the bot always responds quickly and reliably!',
      de: 'Mach dich unabhängig vom Traffic auf der OpenAI-Website! Wir befragen direkt die GPT-4-API. Egal zu welcher Tages- oder Nachtzeit oder ob die halbe Welt gerade mit ChatGPT chattet, der Bot reagiert stets prompt und zuverlässig!',
      fr: "Libère-toi du trafic sur le site web d'OpenAI ! Nous utilisons directement l'API GPT-4. Peu importe l'heure du jour ou de la nuit, ou que la moitié du monde soit en train de discuter avec ChatGPT, le bot répond toujours rapidement et de manière fiable !",
    },
    images: [
      {
        url: 'url("/assets/background/porsche.svg")',
        override: {
          default: {
            backgroundSize: '100%',
          },
        },
      },
    ],
  },
  {
    title: {
      en: 'Join in!',
      de: 'Mach mit!',
      fr: 'Participe !',
    },
    description: {
      en: 'Participate in our study »ChatGPT in Teaching & Learning«. Gain unlimited access to the AI-Tutor in all your rooms. Share feedback from your students with us: Are AI tutors the future? Contact us via the legal notice.',
      de: 'Mach mit bei unserer Studie »ChatGPT in Lehre & Studium«. Erhalte unbegrenzten Zugang zum KI-Tutor in allen deinen Räumen. Teile uns das Feedback deiner Studierenden mit: Sind KI-Tutoren die Zukunft? Kontaktiere uns über das Impressum.',
      fr: "Participe à notre étude « ChatGPT dans l'Enseignement & l'Apprentissage ». Bénéficie d'un accès illimité au Tuteur AI dans toutes tes salles. Partage avec nous les retours de tes étudiants : Les tuteurs IA sont-ils l'avenir ? Contacte-nous via les mentions légales.",
    },
    images: [
      {
        url: 'url("/assets/background/Chatbot.webp")',
        override: {
          default: {
            backgroundSize: '70%',
          },
        },
      },
    ],
  },
  {
    title: {
      en: 'Teach with AI!',
      de: 'Lehre mit KI!',
      fr: "Enseigne avec l'IA !",
    },
    description: {
      en: "ChatGPT summarizes the chapters of your script, isolates learning objectives and key concepts, and generates a glossary of  technical terms. The AI creates exercises and exam questions from your lecture slides and grades submissions and answers. It answers all your students' questions 27/7: competently and in line with the target group.",
      de: 'ChatGPT fasst die Kapitel deines Skripts zusammen, extrahiert Lernziele und Konzepte und generiert ein Glossar mit den Fachbegriffen. Die KI erstellt aus deinen Vorlesungsfolien Übungsaufgaben und Prüfungsfragen, bewertet Einreichungen und Antworten. Sie beantwortet 24/7 alle Fragen deiner Studierenden: stets kompetent und zielgruppengerecht.',
      fr: "ChatGPT résume les chapitres de ton script, isole les objectifs d'apprentissage et les concepts clés, et génère un glossaire de termes techniques. L'IA crée des tâches pratiques et des questions d'examen à partir de tes diapositives de cours, évalue les soumissions et les réponses. Elle répond à toutes les questions de tes étudiants de manière compétente et appropriée à leur niveau, 24 heures sur 24.",
    },
    images: [
      {
        url: 'url("/assets/background/graduation-cap.svg")',
        override: {
          default: {
            backgroundSize: '120%',
          },
        },
      },
    ],
  },
  {
    title: {
      en: 'Learn with AI!',
      de: 'Lerne mit KI!',
      fr: "Apprends avec l'IA !",
    },
    description: {
      en: 'As a student, you can create your own rooms and use all features of frag.jetzt. Ask ChatGPT questions about your courses and save the answers in the Q&A forum. Feed the bot your notes and let it create study materials: from flashcards to exam questions. You can even get quizzed by ChatGPT before an exam: Face the quiz duel with the AI!',
      de: 'Als Student*in kannst du eigene Räume erstellen und alle Funktionen von frag.jetzt nutzen. Stelle ChatGPT Fragen zu deinen Kursen und speichere die Antworten im Q&A-Forum. Gib dem Bot deine Mitschrift und lass ihn daraus Lernmaterialien erstellen: von Lernkarten bis zu Prüfungsfragen. Du kannst dich sogar von ChatGPT vor einer Prüfung abfragen lassen: Stell dich dem Quizduell mit der KI!',
      fr: "En tant qu'étudiant*e, tu peux créer tes propres salles et utiliser toutes les fonctionnalités de frag.jetzt. Pose des questions à ChatGPT sur tes cours et sauvegarde les réponses dans le forum Q&R. Donne au bot tes notes et laisse-le créer des supports d'étude : des flashcards aux questions d'examens. Tu peux même te faire interroger par ChatGPT avant un examen : Affronte l'IA dans un duel de quiz !",
    },
    images: [
      {
        url: 'url("/assets/background/books.svg")',
        override: {
          default: {
            backgroundSize: '70%',
          },
        },
      },
    ],
  },
  {
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
    images: [
      {
        url: 'url("/assets/background/paper.svg")',
        override: {
          default: {
            backgroundSize: '80%',
          },
        },
      },
    ],
  },
  {
    title: {
      en: 'Q&A Forum',
      de: 'Q&A-Forum',
      fr: 'Forum Q&R',
    },
    description: {
      en: 'Everything is anonymous. Everyone can rate the posts of others, but only you in the moderator role can judge the quality: whether right, wrong or particularly good. DeepL takes care of the linguistic deficiencies. Fact check the AI answers and mark them accordingly.',
      de: 'Alles ist anonym. Alle können die Posts der anderen bewerten, aber nur du in der Moderatorenrolle kannst die Qualität beurteilen: ob richtig, falsch oder besonders gut. DeepL kümmert sich um die sprachlichen Mängel. Unterziehe die KI-Antworten einem Faktencheck und kennzeichne sie entsprechend.',
      fr: "Tout est anonyme. Tout le monde peut évaluer les posts des autres, mais toi seul, dans ton rôle de modérateur, peux juger de leur qualité : s'ils sont justes, faux ou particulièrement bons. DeepL s'occupe des défauts linguistiques. Soumets les réponses de l'IA à un contrôle des faits et signale-les en conséquence.",
    },
    images: [
      {
        url: 'url("/assets/background/forum.svg")',
        override: {
          default: {
            backgroundSize: '80%',
          },
        },
      },
    ],
  },
  {
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
    images: [
      {
        url: 'url("/assets/background/moderation-2.svg")',
        override: {
          default: {
            backgroundSize: '80%',
          },
        },
      },
    ],
  },
  {
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
    images: [
      {
        url: 'url("/assets/background/folders.svg")',
        override: {
          default: {
            backgroundSize: '80%',
          },
        },
      },
    ],
  },
  {
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
    images: [
      {
        url: 'url("/assets/background/at-sign.svg")',
        override: {
          default: {
            backgroundSize: '50%',
          },
        },
      },
    ],
  },
  {
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
    images: [
      {
        url: 'url("/assets/background/bonus.svg")',
        override: {
          default: {
            backgroundSize: '80%',
          },
        },
      },
    ],
  },
  {
    title: {
      en: 'Quiz rally',
      de: 'Quiz-Rallye',
      fr: 'Rallye quiz',
    },
    description: {
      en: 'Energize with an interactive quiz! Liven up your teaching with competitions. Whoever answers quickly and correctly gets rewarded with bonus points. This way, learning becomes a fun group experience!',
      de: 'Aktiviere mit Quizfragen! Lockere deinen Unterricht mit Wettbewerben auf. Wer schnell und richtig antwortet, wird mit Bonuspunkten belohnt. So wird Lernen zum unterhaltsamen Gruppenerlebnis!',
      fr: "Anime avec un quiz interactif ! Rends ton enseignement plus vivant avec des compétitions. Celui qui répond vite et correctement est récompensé par des points bonus. Ainsi, l'apprentissage devient une expérience de groupe amusante !",
    },
    images: [
      {
        url: 'url("/assets/background/quizzing-7.webp")',
        override: {
          default: {
            backgroundSize: '80%',
          },
        },
      },
    ],
  },
  {
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
    images: [
      {
        url: 'url("/assets/background/feedback.webp")',
        override: {
          default: {
            backgroundSize: '85%',
          },
        },
      },
    ],
  },
  {
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
    images: [
      {
        url: 'url("/assets/background/Peer-Instruction.webp")',
        override: {
          default: {
            'background-size': '80%',
          },
        },
      },
    ],
  },
  {
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
    images: [
      {
        url: 'url("/assets/background/brainstorming.svg")',
        override: {
          default: {
            'background-size': '80%',
          },
        },
      },
    ],
  },
  {
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
    images: [
      {
        url: 'url("/assets/background/question_radar.svg")',
        override: {
          default: {
            'background-size': '90%',
          },
        },
      },
    ],
  },
  {
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
    images: [
      {
        url: 'url("/assets/background/lens.svg")',
        override: {
          default: {
            'background-size': '80%',
          },
        },
      },
    ],
  },
  {
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
    images: [
      {
        url: 'url("/assets/background/compass.svg")',
        override: {
          default: {
            'background-size': '60%',
          },
        },
      },
    ],
  },
  {
    title: {
      en: 'Test frag.jetzt!',
      de: 'Teste frag.jetzt!',
      fr: 'Teste frag.jetzt !',
    },
    description: {
      en: 'Discover our experimental room and immerse yourself in the new world of audience-response systems! Enter the key code »Feedback«. Explore all features of our platform with ChatGPT, your personal AI tutor. Experiment with realistic data and use cases. Share your feedback, ask us your questions.',
      de: 'Entdecke unseren Experimentierraum und tauche ein in die neue Welt der Audience-Response-Systeme! Gib den Raum-Code »Feedback« ein. Erkunde alle Funktionen unserer Plattform mit ChatGPT, deinem persönlichen KI-Tutor. Experimentiere mit realistischen Daten und Use Cases. Teile dein Feedback, stelle uns deine Fragen.',
      fr: "Découvre notre salle d'expérimentation et plonge-toi dans le monde novateur des systèmes de réponse de l'auditoire! Saisis le code de salle « Feedback ». Explore toutes les fonctionnalités de notre plateforme avec ChatGPT, ton tuteur AI personnel. Expérimente avec des données réalistes et des cas d'utilisation. Partage tes commentaires, pose-nous tes questions.",
    },
    images: [
      {
        url: 'url("/assets/background/test-tubes.svg")',
        override: {
          default: {
            'background-size': '80%',
          },
        },
      },
    ],
  },
  {
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
    images: [
      {
        url: 'url("/assets/background/PWA.svg")',
        override: {
          default: {
            'background-size': '120%',
          },
        },
      },
    ],
  },
  {
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
    images: [
      {
        url: 'url("/assets/background/europa.svg")',
        override: {
          default: {
            'background-size': '90%',
          },
        },
      },
    ],
  },
  {
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
    images: [
      {
        url: 'url("/assets/background/info.svg")',
        override: {
          default: {
            'background-size': '60%',
          },
        },
      },
    ],
  },
  {
    title: {
      en: 'The Price?',
      de: 'Der Preis?',
      fr: 'Le Prix ?',
    },
    description: {
      en: "frag.jetzt is open source and offered as a free software-as-a-service. Each room has a ChatGPT credit: $5 from OpenAI or $20 from us if you participate in our study. In exchange, the chatbot generates millions of words! If that's not enough, you can continue with your own API key from OpenAI.",
      de: 'frag.jetzt ist Open Source und wird als kostenloser Software-as-a-Service angeboten. Jeder Raum hat ein ChatGPT-Guthaben: 5 Dollar von OpenAI oder 20 Dollar von uns, wenn du an unserer Studie teilnimmst. Dafür generiert der Chatbot Millionen von Wörtern! Wenn das nicht genug ist, kannst du mit deinem eigenen API-Key von OpenAI weitermachen.',
      fr: "frag.jetzt est open source et offert comme un logiciel en tant que service gratuit. Chaque salle a un crédit ChatGPT : 5 $ de la part de OpenAI ou 20 $ de notre part si tu participes à notre étude. En échange, le chatbot génère des millions de mots ! Si ce n'est pas suffisant, tu peux continuer avec ta propre clé API de OpenAI.",
    },
    images: [
      {
        url: 'url("/assets/background/dollars.svg")',
        override: {
          default: {
            'background-size': '70%',
          },
        },
      },
    ],
  },
  {
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
    images: [
      {
        url: 'url("/assets/background/rocket.svg")',
        override: {
          default: {
            'background-size': '80%',
          },
        },
      },
    ],
  },
];
