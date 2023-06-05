import {
  ChangeDetectorRef,
  Component,
  ElementRef,
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
        en: 'Introducing ChatGPT',
        de: 'Einführung in ChatGPT',
        fr: 'Présentation de ChatGPT',
      },
      description: {
        en: 'We’ve trained a model called ChatGPT which interacts in a conversational way. The dialogue format makes it possible for ChatGPT to answer followup questions, admit its mistakes, challenge incorrect premises, and reject inappropriate requests.',
        de: 'Wir haben ein Modell namens ChatGPT trainiert, das auf eine dialogische Weise interagiert. Das Dialogformat ermöglicht es ChatGPT, Folgefragen zu beantworten, Fehler zuzugeben, falsche Prämissen in Frage zu stellen und unangemessene Anfragen abzulehnen.',
        fr: "Nous avons formé un modèle appelé ChatGPT qui interagit de manière conversationnelle. Le format de dialogue permet à ChatGPT de répondre à des questions de suivi, d'admettre ses erreurs, de contester des prémisses incorrectes et de rejeter des demandes inappropriées.",
      },
      images: [
        {
          url: 'url("/assets/background/ccchaos (2).svg")',
          override: {},
        },
      ],
    },
    {
      title: {
        en: 'Methods',
        de: 'Methods',
        fr: 'Methods',
      },
      description: {
        en: 'We trained this model using Reinforcement Learning from Human Feedback (RLHF), using the same methods as InstructGPT, but with slight differences in the data collection setup. We trained an initial model using supervised fine-tuning: human AI trainers provided conversations in which they played both sides—the user and an AI assistant. We gave the trainers access to model-written suggestions to help them compose their responses. We mixed this new dialogue dataset with the InstructGPT dataset, which we transformed into a dialogue format.',
        de: 'We trained this model using Reinforcement Learning from Human Feedback (RLHF), using the same methods as InstructGPT, but with slight differences in the data collection setup. We trained an initial model using supervised fine-tuning: human AI trainers provided conversations in which they played both sides—the user and an AI assistant. We gave the trainers access to model-written suggestions to help them compose their responses. We mixed this new dialogue dataset with the InstructGPT dataset, which we transformed into a dialogue format.',
        fr: 'We trained this model using Reinforcement Learning from Human Feedback (RLHF), using the same methods as InstructGPT, but with slight differences in the data collection setup. We trained an initial model using supervised fine-tuning: human AI trainers provided conversations in which they played both sides—the user and an AI assistant. We gave the trainers access to model-written suggestions to help them compose their responses. We mixed this new dialogue dataset with the InstructGPT dataset, which we transformed into a dialogue format.',
      },
      images: [
        {
          url: 'url("/assets/background/patternpad (1).svg")',
          override: {
            default: {
              'right.px': -500,
            },
          },
        },
      ],
    },
    {
      title: {
        en: 'Iterative deployment',
        de: 'Iterative deployment',
        fr: 'Iterative deployment',
      },
      description: {
        en: 'Today’s research release of ChatGPT is the latest step in OpenAI’s iterative deployment of increasingly safe and useful AI systems. Many lessons from deployment of earlier models like GPT-3 and Codex have informed the safety mitigations in place for this release, including substantial reductions in harmful and untruthful outputs achieved by the use of reinforcement learning from human feedback (RLHF).',
        de: 'Today’s research release of ChatGPT is the latest step in OpenAI’s iterative deployment of increasingly safe and useful AI systems. Many lessons from deployment of earlier models like GPT-3 and Codex have informed the safety mitigations in place for this release, including substantial reductions in harmful and untruthful outputs achieved by the use of reinforcement learning from human feedback (RLHF).',
        fr: 'Today’s research release of ChatGPT is the latest step in OpenAI’s iterative deployment of increasingly safe and useful AI systems. Many lessons from deployment of earlier models like GPT-3 and Codex have informed the safety mitigations in place for this release, including substantial reductions in harmful and untruthful outputs achieved by the use of reinforcement learning from human feedback (RLHF).',
      },
      images: [
        {
          url: 'url("/assets/background/patterns (3).svg")',
          override: {},
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
