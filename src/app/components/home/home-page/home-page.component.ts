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
        en: 'Inspire your learners with our interactive AI chatbot. It provides answers tailored to the individual needs of the questioners. Define prompt settings and combine them to receive precise and customized answers. Discover the unlimited possibilities of chat to inspire and support both teachers and learners alike.\n',
        de: 'Begeistern Sie Ihre Lernenden mit unserem interaktiven KI-Chatbot. Er liefert Antworten, die auf die individuellen Bedürfnisse der Fragenden abgestimmt sind. Definieren Sie Prompt-Voreinstellungen und kombinieren Sie diese, um präzise und maßgeschneiderte Antworten zu erhalten. Entdecken Sie die unbegrenzten Möglichkeiten des Chats, um Lehrende und Lernende gleichermaßen zu inspirieren und zu unterstützen.',
        fr: 'Inspirez vos apprenants avec notre chatbot IA interactif. Il fournit des réponses adaptées aux besoins individuels des personnes qui posent des questions. Définissez des paramètres de prompt et combinez-les pour recevoir des réponses précises et personnalisées. Découvrez les possibilités illimitées du chat pour inspirer et soutenir à la fois les enseignants et les apprenants.\n',
      },
      images: [
        {
          url: 'url("/assets/background/background-gpt1_masked.png")',
          override: {
            default: {
              backgroundSize: 'cover',
            },
          },
        },
      ],
    },
    {
      title: {
        en: 'Bonus for Good Questions',
        de: 'Bonus für gute Fragen',
        fr: 'Bonus pour les Bonnes Questions',
      },
      description: {
        en: "Promote your learners' engagement and reward outstanding questions with stars! With each star awarded, the questioners receive a code, which they can redeem via email to receive bonus points. This recognition motivates your learners and creates a positive learning culture. Track your learners' progress and inspire them to ask more great questions!\n",
        de: 'Fördern Sie das Engagement Ihrer Lernenden und belohnen Sie herausragende Fragen mit Sternen! Mit jedem vergebenen Stern erhalten die Fragenden einen Code, den sie per Mail einlösen können, um Bonuspunkte zu erhalten. Diese Anerkennung motiviert Ihre Lernenden und schafft eine positive Lernkultur. Verfolgen Sie die Fortschritte Ihrer Lernenden und inspirieren Sie sie zu weiteren großartigen Fragen!',
        fr: "Encouragez l'engagement de vos apprenants et récompensez les questions exceptionnelles avec des étoiles ! Pour chaque étoile attribuée, les personnes qui posent des questions reçoivent un code, qu'elles peuvent échanger par e-mail pour obtenir des points bonus. Cette reconnaissance motive vos apprenants et crée une culture d'apprentissage positive. Suivez les progrès de vos apprenants et inspirez-les à poser d'autres excellentes questions !\n",
      },
      images: [
        {
          url: 'url("/assets/background/background-2.png")',
          override: {
            default: {
              backgroundSize: 'auto 100%',
            },
          },
        },
      ],
    },
    {
      title: {
        en: 'Quizzing',
        de: 'Quizzen',
        fr: 'Quiz',
      },
      description: {
        en: 'Excite your learners with an interactive quiz! This way, you can promote playful learning and liven up the classroom through competition. The quiz questions vary in difficulty and points are awarded based on the correctness of the answers and speed. Challenge your learners and motivate them with bonus points in the leaderboard. Make learning a fun group experience!\n',
        de: 'Begeistern Sie Ihre Lernenden mit einem interaktiven Quiz! So können Sie spielerisches Lernen fördern und den Unterricht durch Wettbewerb auflockern. Die Quizfragen haben verschiedene Schwierigkeitsgrade und die Punkte werden nach Richtigkeit der Antworten und Schnelligkeit vergeben. Fordern Sie Ihre Lernenden heraus und motivieren Sie sie mit Bonuspunkten in der Rangliste. Machen Sie Lernen zu einem unterhaltsamen Gruppenerlebnis!',
        fr: "Excitez vos apprenants avec un quiz interactif ! De cette manière, vous pouvez promouvoir un apprentissage ludique et animer la salle de classe grâce à la compétition. Les questions du quiz varient en difficulté et les points sont attribués en fonction de la justesse des réponses et de la rapidité. Challengez vos apprenants et motivez-les avec des points bonus dans le classement. Faites de l'apprentissage une expérience de groupe amusante !\n",
      },
      images: [
        {
          url: 'url("/assets/background/Countdown.webp")',
          override: {
            default: {
              backgroundPosition: 'center right',
              backgroundSize: '45%',
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
        en: 'Get valuable feedback in real time! With just one click, you can solicit the opinion of your learners. Numerous survey templates are available for you. The dynamic display of votes cast increases the willingness to participate. Use flash polls to improve your events and actively involve your learners in the process!\n',
        de: 'Holen Sie sich wertvolles Feedback in Echtzeit! Mit nur einem Klick können Sie die Meinung Ihrer Lernenden einholen. Zahlreiche Umfragevorlagen stehen Ihnen zur Verfügung. Die dynamische Anzeige der abgegebenen Stimmen erhöht die Bereitschaft zur Teilnahme. Nutzen Sie Blitzumfragen, um Ihre Veranstaltungen zu verbessern und Ihre Lernenden aktiv in den Prozess einzubeziehen!',
        fr: "Obtenez des commentaires précieux en temps réel ! En un seul clic, vous pouvez solliciter l'opinion de vos apprenants. De nombreux modèles de sondages sont à votre disposition. L'affichage dynamique des votes augmente la volonté de participer. Utilisez des sondages éclairs pour améliorer vos événements et impliquer activement vos apprenants dans le processus !\n",
      },
      images: [
        {
          url: 'url("/assets/background/question-mark.webp")',
          override: {
            default: {
              backgroundSize: 'auto 100%',
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
        en: "Awaken your learners' creativity in an interactive brainstorming session! Pose a guiding question and visualize all ideas in real time in a word cloud. With the rating function and the ability to edit contributions, ideas are further developed and refined. Create an inspiring and collaborative atmosphere where learners can unfold their creativity and develop innovative solutions!\n",
        de: 'Wecken Sie die Kreativität Ihrer Lernenden in einer interaktiven Brainstorming-Session! Stellen Sie eine Leitfrage und visualisieren Sie alle Ideen in Echtzeit in einer Wortwolke. Mit der Bewertungsfunktion und der Möglichkeit, Beiträge zu bearbeiten, werden die Ideen weiterentwickelt und verfeinert. Schaffen Sie eine inspirierende und kollaborative Atmosphäre, in der die Lernenden ihre Kreativität entfalten und innovative Lösungen entwickeln können!\n',
        fr: "Éveillez la créativité de vos apprenants lors d'une séance de brainstorming interactif ! Posez une question directrice et visualisez toutes les idées en temps réel dans un nuage de mots. Grâce à la fonction d'évaluation et à la possibilité d'éditer les contributions, les idées sont développées et affinées. Créez une atmosphère inspirante et collaborative où les apprenants peuvent déployer leur créativité et développer des solutions innovantes !\n",
      },
      images: [
        {
          url: 'url("/assets/background/antworte_jetzt.webp")',
          override: {
            default: {
              'background-size': '50%',
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
        en: 'Effortlessly keep track of hundreds of questions with our Question Radar! An AI analyzes the questions and suggests thematic keywords. By using DeepL for translation and immediate back-translation, you can ensure that the texts have no linguistic deficits. With the radar, you get a quick overview of the central themes and can reach the hotspots in the Q&A forum with one click!\n',
        de: 'Behalten Sie mühelos den Überblick über Hunderte von Fragen mit unserem Fragen-Radar! Eine KI analysiert die Fragen und schlägt thematische Stichwörter vor. Durch die Verwendung von DeepL für die Übersetzung und sofortige Rückübersetzung können Sie sicherstellen, dass die Texte keine sprachlichen Defizite aufweisen. Mit dem Radar erhalten Sie einen schnellen Überblick über die zentralen Themen und gelangen mit einem Klick zu den Hotspots im Q&A-Forum!',
        fr: "Gardez facilement une vue d'ensemble de centaines de questions avec notre Radar de Questions ! Une IA analyse les questions et suggère des mots-clés thématiques. En utilisant DeepL pour la traduction et la retraduction immédiate, vous pouvez vous assurer que les textes ne présentent pas de déficits linguistiques. Avec le radar, vous obtenez un aperçu rapide des thèmes centraux et vous pouvez atteindre les points chauds du forum Q&R en un clic !\n",
      },
      images: [
        {
          url: 'url("/assets/background/radar.svg")',
          override: {},
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
        en: 'Present questions with style and impact! Display questions in large format on a projector and comfortably navigate through the questions using the arrow keys. Switch to autofocus to automatically display new questions in full view. Inspire your learners for insightful discussions and create an interactive learning environment that focuses on questions that have been upvoted or controversially discussed.\n',
        de: 'Präsentieren Sie Fragen mit Stil und Wirkung! Stellen Sie Fragen großformatig am Beamer dar und navigieren Sie mit den Pfeiltasten bequem durch die Fragen. Schalten Sie in den Autofokus, um neue Fragen automatisch in Vollansicht anzuzeigen. Inspirieren Sie Ihre Lernenden zu aufschlussreichen Diskussionen und schaffen Sie eine interaktive Lernumgebung, die den Fokus auf Fragen legt, die hochgevotet oder kontrovers diskutiert wurden.',
        fr: "Présentez les questions avec style et impact ! Affichez les questions en grand format sur un projecteur et naviguez confortablement à travers les questions à l'aide des flèches. Passez en mode autofocus pour afficher automatiquement les nouvelles questions en plein écran. Inspirez vos apprenants à des discussions perspicaces et créez un environnement d'apprentissage interactif qui met l'accent sur les questions qui ont été hautement votées ou discutées de manière controversée.\n",
      },
      images: [
        {
          url: 'url("/assets/background/lens-1723832_1920.png")',
          override: {
            default: {},
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
