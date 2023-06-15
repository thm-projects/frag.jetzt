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
import { filter, take } from 'rxjs';
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
          url: 'url("/assets/background/chatgpt.svg")',
          override: {
            default: {
              backgroundSize: 'auto 85%',
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
        en: 'Boost the engagement of your learners and reward good questions with a star! Stars can be redeemed for bonus points via email. This appreciation motivates and contributes to a positive learning culture.',
        de: 'Fördere das Engagement deiner Lernenden und belohne gute Fragen mit einem Stern! Sterne können per Mail in Bonuspunkte eingelöst werden. Diese Wertschätzung motiviert  und trägt zu einer positiven Lernkultur bei.',
        fr: "Stimule l'engagement de tes apprenants et récompense les bonnes questions par une étoile ! Les étoiles peuvent être échangées contre des points bonus par email. Cette reconnaissance motive et contribue à une culture d'apprentissage positive.",
      },
      images: [
        {
          url: 'url("/assets/background/bonus.svg")',
          override: {
            default: {
              backgroundSize: 'auto 65%',
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
        en: 'Energize your group with an interactive quiz! Liven up your teaching with competitions. Whoever answers quickly and correctly gets rewarded with bonus points. This way, learning becomes a fun group experience!',
        de: 'Aktiviere deine Gruppe mit einem interaktiven Quiz! Lockere deinen Unterricht mit Wettbewerben auf. Wer schnell und richtig antwortet, wird mit Bonuspunkten belohnt. So wird Lernen zum unterhaltsamen Gruppenerlebnis!',
        fr: "Anime ton groupe avec un quiz interactif ! Rends ton enseignement plus vivant avec des compétitions. Celui qui répond vite et correctement est récompensé par des points bonus. Ainsi, l'apprentissage devient une expérience de groupe amusante !",
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
        en: 'Get valuable real-time feedback with just one click! Numerous templates are available for you. Use flash polls to optimize your event or to find out if everyone can follow you.',
        de: 'Hol dir wertvolles Feedback in Echtzeit mit nur einem Klick!  Zahlreiche Vorlagen stehen dir zur Verfügung. Nutze Blitzumfragen, um deine Veranstaltung zu optimieren oder um herauszufinden, ob dir alle folgen können.',
        fr: 'Obtiens des retours précieux en temps réel avec un simple clic ! De nombreux modèles sont à ta disposition. Utilise des sondages éclair pour optimiser ton événement ou pour savoir si tout le monde peut te suivre.',
      },
      images: [
        {
          url: 'url("/assets/background/flash_poll.svg")',
          override: {
            default: {
              backgroundSize: 'auto 60%',
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
        de: 'Wecke die Kreativität deiner Gruppe mit einem interaktiven Brainstorming! Stelle eine Leitfrage und visualisiere alle Ideen in Echtzeit in einer Wortwolke. Bonustipp: Mit nur einem Klick generiert dir ChatGPT beliebig viele Ideen!',
        fr: "Réveille la créativité de ton groupe avec un brainstorming interactif! Pose une question guide et visualise toutes les idées en temps réel dans un nuage de mots. Conseil bonus : Avec un simple clic, ChatGPT génère autant d'idées que tu en as besoin !",
      },
      images: [
        {
          url: 'url("/assets/background/brainstorming.svg")',
          override: {
            default: {
              'background-size': 'auto 60%',
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
        en: 'Effortlessly keep track of hundreds of questions! An AI analyzes the questions and suggests thematic keywords. With the question radar, you get a quick overview of the central themes and can reach the hotspots in the Q&A forum with just one click!',
        de: 'Behalte mühelos den Überblick über hunderte von Fragen! Eine KI analysiert die Fragen und schlägt thematische Stichwörter vor. Mit dem Fragen-Radar erhältst du einen schnellen Überblick über die zentralen Themen und gelangst mit einem Klick zu den Hotspots im Q&A-Forum!',
        fr: "Garde facilement une vue d'ensemble sur des centaines de questions ! Une IA analyse les questions et suggère des mots-clés thématiques. Avec le radar de questions, tu obtiens un aperçu rapide des thèmes centraux et tu peux atteindre les points chauds dans le forum Q&R en un seul clic !",
      },
      images: [
        {
          url: 'url("/assets/background/question_radar.svg")',
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
        en: 'Question Focus',
        de: 'Fragen-Fokus',
        fr: 'Focus sur les Questions',
      },
      description: {
        en: 'Present questions with style and impact! Show individual questions in large format on the projector. Switch to autofocus to automatically display new questions in full screen. Focus on questions that have been highly rated or controversially discussed.',
        de: 'Präsentiere Fragen mit Stil und Wirkung! Zeig einzelne Fragen im Großformat am Beamer. Schalte auf Autofokus, um neue Fragen automatisch im Vollbild anzuzeigen. Lege den Fokus auf Fragen, die hoch bewertet oder kontrovers diskutiert wurden.',
        fr: "Présente des questions avec style et impact ! Affiche des questions individuelles en grand format sur le projecteur. Passe en autofocus pour afficher automatiquement les nouvelles questions en plein écran. Concentre-toi sur les questions qui ont été très bien notées ou qui ont fait l'objet de discussions controversées.",
      },
      images: [
        {
          url: 'url("/assets/background/lens.svg")',
          override: {
            default: {
              'background-size': '32%',
            },
          },
        },
      ],
    },
  ];

  private currentTheme: string;

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

  @HostListener('wheel', ['$event']) _onWheel(wheel: WheelEvent) {
    if (!wheel.ctrlKey) {
      if (wheel.deltaY > 0) {
        if (this.carouselIndex < this.carousel.length - 1) {
          this.carouselIndex += 1;
        }
      } else if (wheel.deltaY < 0) {
        if (this.carouselIndex > 0) {
          this.carouselIndex -= 1;
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
    this.listenerFn?.();
    this.eventService.makeFocusOnInputFalse();
  }

  public announce() {
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
}
