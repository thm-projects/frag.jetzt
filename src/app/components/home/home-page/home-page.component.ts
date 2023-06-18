import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { EventService } from '../../../services/util/event.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { KeyboardUtils } from '../../../utils/keyboard';
import { KeyboardKey } from '../../../utils/keyboard/keys';
import { TranslateService } from '@ngx-translate/core';
import { RatingService } from '../../../services/http/rating.service';
import { RatingResult } from '../../../models/rating-result';
import { SessionService } from '../../../services/util/session.service';
import { OnboardingService } from '../../../services/util/onboarding.service';
import { NotificationService } from 'app/services/util/notification.service';
import { LanguageService } from 'app/services/util/language.service';
import { filter, ReplaySubject, take } from 'rxjs';
import { ThemeService } from '../../../../theme/theme.service';

export type CarouselEntryKind = 'highlight' | 'peek' | 'hidden';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: [
    './home-page.component.scss',
    '../../shared/utility/style/common-style.scss',
  ],
})
export class HomePageComponent implements OnInit, OnDestroy {
  @ViewChild('carouselScrollElement')
  _carouselScrollElement: ElementRef<HTMLDivElement>;
  listenerFn: () => void;

  accumulatedRatings: RatingResult;

  protected carouselIndex: number = 0;
  protected readonly carousel = [
    {
      title: {
        en: 'ChatGPT',
        de: 'ChatGPT',
        fr: 'ChatGPT',
      },
      description: {
        en: "Let ChatGPT answer all the questions. Our prompt catalog will help you generate tailored and precise texts. A quick fact check, and you've saved yourself hours of work. Experience how AI makes you more efficient!",
        de: 'Lass ChatGPT alle Fragen beantworten. Unser Prompt-Katalog hilft dir, maßgeschneiderte und präzise Texte zu generieren. Ein kurzer Faktencheck und du hast dir viele Stunden Arbeit erspart. Erlebe, wie die KI dich effizienter macht!',
        fr: "Laisse ChatGPT répondre à toutes les questions. Notre catalogue de prompts t'aidera à générer des textes précis et sur mesure. Un rapide contrôle des faits et tu as économisé des heures de travail. Découvre comment l'IA te rend plus efficace !",
      },
      images: [
        {
          url: 'url("/assets/background/anatomy.svg")',
          override: {
            default: {
              backgroundSize: '37%',
            },
          },
        },
      ],
    },
    {
      title: {
        en: 'AI Tutor',
        de: 'KI-Tutor',
        fr: 'Tuteur AI',
      },
      description: {
        en: 'Participate in our study »ChatGPT in Teaching & Learning«. Gain unlimited access to the AI-Tutor in all your rooms. Share feedback from your students and tutors with us. Is this the future of learning platforms? Find out. Contact us via the legal notice.',
        de: 'Mach mit bei unserer Studie »ChatGPT in Lehre & Studium«. Erhalte unbegrenzten Zugang zum KI-Tutor in allen deinen Räumen. Teile uns das Feedback deiner Studierenden und Tutor*innen mit: Sind KI-Tutoren die Zukunft? Finde es heraus! Kontaktiere uns über das Impressum.',
        fr: "Participe à notre étude « ChatGPT dans l'Enseignement & l'Apprentissage ». Bénéficie d'un accès illimité au Tuteur AI dans toutes tes salles. Partage avec nous les retours de tes étudiants et tuteurs. Est-ce l'avenir des plateformes d'apprentissage ? Découvre-le. Contacte-nous via les mentions légales.",
      },
      images: [
        {
          url: 'url("/assets/background/Chatbot.png")',
          override: {
            default: {
              backgroundSize: '33%',
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
        en: "Everything is anonymous. Everyone can rate the posts with a thumbs up or down. You can assess the quality of posts in various ways: as correct, incorrect or exceptionally good. DeepL takes care of linguistic flaws. Subject the AI-Tutor's answers to a fact-check and mark them accordingly.",
        de: 'Alles ist anonym. Alle können die Posts der anderen bewerten, aber nur du kannst die Qualität beurteilen: ob richtig, falsch oder besonders gut. DeepL kümmert sich um die sprachlichen Mängel. Unterziehe die KI-Antworten einem Faktencheck und kennzeichne sie entsprechend.',
        fr: "Tout est anonyme. Tout le monde peut évaluer les publications par un système de pouce. Tu peux juger de la qualité des posts de différentes manières : corrects, incorrects ou particulièrement bons. DeepL s'occupe des imperfections linguistiques. Soumets les réponses du Tuteur AI à une vérification des faits et marque-les en conséquence.",
      },
      images: [
        {
          url: 'url("/assets/background/forum.svg")',
          override: {
            default: {
              backgroundSize: '33%',
            },
          },
        },
      ],
    },
    {
      title: {
        en: 'Q&A Moderation',
        de: 'Q&A-Moderation',
        fr: 'Modération Q&R',
      },
      description: {
        en: "Want to review posts before they are published in the forum? Use our moderation feature. Or set it to automated: Define a threshold for negative ratings, beyond which posts are moved to moderation. This way, the group can co-decide what content belongs in the forum and what doesn't.",
        de: 'Du möchtest Beiträge vor der Veröffentlichung im Forum prüfen? Dann nutze unsere Moderationsfunktion. Oder automatisiert: Lege eine Schwelle für negative Bewertungen fest, ab der Beiträge in die Moderation verschoben werden. So kann die Gruppe mitentscheiden, welche Inhalte ins Forum gehören und welche nicht.',
        fr: "Veux-tu vérifier les posts avant qu'ils ne soient publiés sur le forum ? Utilise notre fonction de modération. Ou en automatique : fixe un seuil pour les évaluations négatives, au-delà duquel les posts sont déplacés vers la modération. Ainsi, le groupe peut co-décider du contenu qui appartient au forum et celui qui n'y appartient pas.",
      },
      images: [
        {
          url: 'url("/assets/background/moderation-2.svg")',
          override: {
            default: {
              backgroundSize: '33%',
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
        en: "With frag.jetzt, you're surely not planning for a fleeting visit, but for long-term use. It's understandable that you don't want to search for new posts in each room every day. That's why we've set up a mail option for every room. You decide whether and when you want to receive notifications – an exclusive service for registered users.",
        de: 'Mit frag.jetzt planst du sicher nicht nur tagesaktuell, sondern langfristig. Klar, dass du nicht jeden Tag in jedem Raum nach neuen Beiträgen suchen willst. Deshalb haben wir eine Mail-Option eingerichtet. Du entscheidest, ob und wann du Benachrichtigungen erhalten möchtest – ein exklusiver Service für registrierte User.',
        fr: "Avec frag.jetzt, tu ne prévois sûrement pas une visite éphémère, mais une utilisation à long terme. Il est compréhensible que tu ne veuilles pas chercher de nouveaux posts dans chaque salle chaque jour. C'est pourquoi nous avons mis en place une option mail pour chaque salle. Tu décides si et quand tu veux recevoir des notifications – un service exclusif pour les utilisateurs enregistrés.",
      },
      images: [
        {
          url: 'url("/assets/background/at-sign.svg")',
          override: {
            default: {
              backgroundSize: '27%',
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
              backgroundSize: '35%',
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
          url: 'url("/assets/background/quizzing-7.png")',
          override: {
            default: {
              backgroundSize: '35%',
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
          url: 'url("/assets/background/poll.png")',
          override: {
            default: {
              backgroundSize: '33%',
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
        en: 'Stir up the creativity of your group with an interactive brainstorming session! Ask a guiding question and visualize all ideas in real-time in a word cloud. Bonus tip: With just one click, ChatGPT generates as many ideas as you need!',
        de: 'Wecke die Kreativität deiner Gruppe! Mit einem Brainstorming wird es gelingen! Stelle eine Leitfrage und visualisiere alle Ideen in Echtzeit in einer Wortwolke. Bonustipp: Mit nur einem Klick generiert ChatGPT beliebig viele Ideen zu jedem Thema!',
        fr: "Réveille la créativité de ton groupe avec un brainstorming interactif  Pose une question guide et visualise toutes les idées en temps réel dans un nuage de mots. Conseil bonus : Avec un simple clic, ChatGPT génère autant d'idées que tu en as besoin !",
      },
      images: [
        {
          url: 'url("/assets/background/brainstorming.svg")',
          override: {
            default: {
              'background-size': '35%',
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
              'background-size': '36%',
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
              'background-size': '34%',
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
        de: 'frag.jetzt steht voll und ganz im Einklang mit der EU-Datenschutz-Grundverordnung. Sie garantiert, dass deine persönlichen Daten geschützt und vertraulich behandelt werden. Unsere App wird sicher und zuverlässig in Deutschland gehostet. Beachte: Die Nutzung von ChatGPT erfordert die Zustimmung zur Datenschutzerklärung von OpenAI.',
        fr: "frag.jetzt est en parfaite conformité avec le Règlement Général sur la Protection des Données de l'UE. Il garantit que tes données personnelles sont protégées et traitées de manière confidentielle. Notre application est hébergée de manière sécurisée et fiable en Allemagne. Note que l'utilisation de ChatGPT nécessite l'acceptation de la politique de confidentialité d'OpenAI.",
      },
      images: [
        {
          url: 'url("/assets/background/europa.svg")',
          override: {
            default: {
              'background-size': '34%',
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
        en: "Great that you've scrolled this far! Take a look at the footer on the left. There you will find lots of useful information and tips. It's worth it! Start your journey of discovery now!",
        de: 'Schön, dass du bis hierher gescrollt hast! Schau mal links in die Fußzeile. Dort findest du viele nützliche Informationen und Tipps. Es lohnt sich! Geh jetzt auf Entdeckungsreise!',
        fr: "Super que tu aies défilé jusque ici ! Regarde dans le pied de page à gauche. Là, tu trouveras beaucoup d'informations utiles et des astuces. Ça vaut le coup ! Commence ton voyage de découverte maintenant !",
      },
      images: [
        {
          url: 'url("/assets/background/info.svg")',
          override: {
            default: {
              'background-size': '34%',
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
              'background-size': '34%',
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
        en: "Book a room, share the key code. It's that easy! If you want to use frag.jetzt with ChatGPT at all times, in any browser, on any device, set up a free account: Click on »Sign in« in the top right corner. Don't hold back, try everything out!",
        de: "Raum buchen, Raum-Code teilen. So einfach geht's! Wenn du frag.jetzt mit ChatGPT immer und in jedem Browser auf jedem Gerät einsetzen willst, richte dir ein kostenloses Konto ein: Klick oben rechts auf »Anmelden«. Hab keine Hemmungen, probier alles aus!",
        fr: "Réserve une salle, distribue le code de la salle. C'est si simple ! Si tu veux utiliser frag.jetzt avec ChatGPT à tout moment, dans n'importe quel navigateur, sur n'importe quel appareil, crée un compte gratuit : Il suffit de cliquer sur « Se connecter » en haut à droite. Ne te retiens pas, essaie tout !",
      },
      images: [
        {
          url: 'url("/assets/background/rocket.svg")',
          override: {
            default: {
              'background-size': '40%',
            },
          },
        },
      ],
    },
  ];
  protected readonly mobileBoundaryWidth = 600;
  protected readonly mobileBoundaryHeight = 630;

  private currentTheme: string;
  private readonly _destroyer: ReplaySubject<number> =
    new ReplaySubject<number>(1);
  private lastScrollMs: number = -1;

  constructor(
    private translateService: TranslateService,
    private eventService: EventService,
    private liveAnnouncer: LiveAnnouncer,
    private _r: Renderer2,
    private ratingService: RatingService,
    private sessionService: SessionService,
    private onboardingService: OnboardingService,
    private notificationService: NotificationService,
    public readonly languageService: LanguageService,
    private readonly cdr: ChangeDetectorRef,
    public readonly themeService: ThemeService,
  ) {
    themeService.getTheme().subscribe((x) => (this.currentTheme = x.key));
    const arrowEventListener = (event: KeyboardEvent) => {
      if (!document.activeElement.hasAttribute('mat-menu-item')) {
        switch (event.key) {
          case 'ArrowUp':
            this.setCarouselIndex(this.carouselIndex - 1);
            break;
          case 'ArrowDown':
            this.setCarouselIndex(this.carouselIndex + 1);
            break;
        }
      }
    };
    window.addEventListener('keydown', arrowEventListener, true);
    this._destroyer.subscribe(() => {
      this.listenerFn?.();
      this.eventService.makeFocusOnInputFalse();
      window.removeEventListener('keydown', arrowEventListener);
    });
  }

  get carouselOffset() {
    if (this._carouselScrollElement) {
      const target = this._carouselScrollElement.nativeElement.children[
        this.carouselIndex
      ] as HTMLDivElement;
      return {
        'top.px': -target.offsetTop - target.offsetHeight / 2,
      };
    } else {
      return {};
    }
  }

  /**
   * @desc touchpad scroll fires multiple events with different deltaY.\
   * In order to limit the request amount, a time switch is added.
   * @param wheel
   */
  @HostListener('wheel', ['$event']) _onWheel(wheel: WheelEvent) {
    if (!wheel.ctrlKey && wheel.deltaY) {
      if (
        Math.abs(wheel.deltaY) === 120 ||
        this.lastScrollMs === -1 ||
        new Date().getTime() - this.lastScrollMs > 200
      ) {
        let changed = true;
        if (wheel.deltaY > 0) {
          this.setCarouselIndex(this.carouselIndex + 1);
        } else if (wheel.deltaY < 0) {
          this.setCarouselIndex(this.carouselIndex - 1);
        } else {
          changed = false;
        }
        if (changed) {
          this.lastScrollMs = new Date().getTime();
        }
      }
    }
  }

  getBackgroundStyleForEntry(i: number): any {
    let _override = {};
    if (i < this.carouselIndex) {
      _override['opacity'] = 0;
    } else if (i > this.carouselIndex) {
      _override['opacity'] = 0;
    } else {
      _override['opacity'] = 1;
    }
    if (this.carousel[i].images[0]['override']) {
      _override = {
        ..._override,
        ...this.carousel[i].images[0]['override'][this.currentTheme + '-theme'],
      };
      if (this.carousel[i].images[0]['override']['default']) {
        _override = {
          ..._override,
          ...this.carousel[i].images[0]['override']['default'],
        };
      }
    }
    return {
      ...{
        backgroundImage: this.carousel[i].images[0].url,
        transform: `translateY(${(this.carouselIndex - i) * -1000}px)`,
      },
      ..._override,
    };
  }

  getStyleForEntry(i: number, kind: CarouselEntryKind): any {
    switch (kind) {
      case 'highlight':
        return {};
      case 'peek':
        return {};
      case 'hidden':
        return {};
      default:
        return {};
    }
  }

  getEntryKind(i: number): CarouselEntryKind {
    if (i === this.carouselIndex) {
      return 'highlight';
    } else if (i === this.carouselIndex - 1 || i === this.carouselIndex + 1) {
      return 'peek';
    } else {
      return 'hidden';
    }
  }

  ngOnInit() {
    this.ratingService.getRatings().subscribe((r) => {
      this.accumulatedRatings = r;
    });
    this.sessionService.onReady.subscribe(() => {
      this.onboardingService.startDefaultTour();
      this.loadListener();
    });
    this.eventService.on('not-authorized').subscribe(() => {
      this.languageService
        .getLanguage()
        .pipe(
          filter((v) => Boolean(v)),
          take(1),
        )
        .subscribe(() => {
          this.translateService
            .get('login.not-authorized')
            .subscribe((msg) => this.notificationService.show(msg));
        });
    });
  }

  loadListener() {
    this.listenerFn = this._r.listen(document, 'keyup', (event) => {
      if (
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit1) === true &&
        this.eventService.focusOnInput === false
      ) {
        document.getElementById('session_id-input').focus();
      } else if (
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit3) === true &&
        this.eventService.focusOnInput === false
      ) {
        document.getElementById('new_session-button').focus();
      } else if (
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit4) === true &&
        this.eventService.focusOnInput === false
      ) {
        document.getElementById('language-menu').focus();
      } else if (
        KeyboardUtils.isKeyEvent(
          event,
          KeyboardKey.Escape,
          KeyboardKey.Digit9,
        ) === true &&
        this.eventService.focusOnInput === false
      ) {
        this.announce();
      } else if (
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Escape) === true &&
        this.eventService.focusOnInput === true
      ) {
        document.getElementById('session_enter-button').focus();
        this.eventService.makeFocusOnInputFalse();
      }
    });
  }

  ngOnDestroy() {
    this._destroyer.next(1);
  }

  announce() {
    const lang: string = this.translateService.currentLang;
    this.liveAnnouncer.clear();
    if (lang === 'de') {
      this.liveAnnouncer.announce(
        'Du befindest dich auf der Startseite von frag jetzt. ' +
          'Drücke die Taste 1 um einen Raum-Code einzugeben, die Taste 2 um in die Benutzer-Anmeldung ' +
          'oder das Sitzungs-Menü zu gelangen, die Taste 3 um eine neue Sitzung zu erstellen, ' +
          'die Taste 4 um zur Sprachauswahl zu gelangen, oder die Taste 9 um diese Ansage zu wiederholen.',
        'assertive',
      );
    } else {
      this.liveAnnouncer.announce(
        'You are on the homepage of frag jetzt. ' +
          'Press key 1 to enter a room code, key 2 to enter the user login ' +
          'or the session menu, press 3 to create a new session, ' +
          'Press 4 to go to the language selection menu or 9 to repeat this announcement',
        'assertive',
      );
    }
  }

  selectEntry(i: number, entryElement: HTMLDivElement) {
    this.carouselIndex = i;
  }

  getPositionClass(i: number) {
    let _class = '';
    const offset = i - this.carouselIndex;
    if (offset === -2 || offset === 2) {
      _class = '';
    } else {
      _class += 'hide ';
    }
    if (offset === 0) _class += 'center';
    else if (offset < 0) _class += 'bottom';
    else _class += 'top';
    return _class;
  }

  private setCarouselIndex(carouselIndex: number, throwError: boolean = false) {
    if (carouselIndex < 0 || carouselIndex >= this.carousel.length) {
      if (throwError) {
        throw new Error();
      }
    } else {
      this.carouselIndex = carouselIndex;
    }
  }
}
