import {
  AfterContentInit,
  AfterViewInit,
  Component,
  HostBinding,
  Injector,
  OnDestroy,
  OnInit,
  Renderer2,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { RoomPageComponent } from '../../shared/room-page/room-page.component';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { KeyboardUtils } from '../../../utils/keyboard';
import { KeyboardKey } from '../../../utils/keyboard/keys';
import { RoomSettingsOverviewComponent } from '../../shared/_dialogs/room-settings-overview/room-settings-overview.component';
import { FormControl } from '@angular/forms';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { M3NavigationService } from '../../../../modules/m3/services/navigation/m3-navigation.service';
import { M3NavigationKind } from '../../../../modules/m3/components/navigation/m3-nav-types';

@Component({
  selector: 'app-room-creator-page',
  templateUrl: './room-creator-page.component.html',
  styleUrls: ['./room-creator-page.component.scss'],
  animations: [
    trigger('ContentTemplateAnimation', [
      state(
        'out',
        style({
          transform: `translateY(-8px)`,
          opacity: 0,
        }),
      ),
      state(
        'in',
        style({
          transform: `translateY(0px)`,
          opacity: 1,
        }),
      ),
      transition('* <=> *', [animate('0.2s ease')]),
    ]),
  ],
})
export class RoomCreatorPageComponent
  extends RoomPageComponent
  implements OnInit, OnDestroy, AfterContentInit, AfterViewInit {
  /**
   * on true: shows all elements regardless of *ngIf
   */
  __debug = true;

  @HostBinding('class.new-ui') get _HostBindingNewUI() {
    return this.newUI;
  }

  newUI = true;
  contentTemplate: TemplateRef<unknown>;
  templateName: string;
  roomTags: FormControl = new FormControl<unknown>([]);
  contentAnimationState: string = 'out';
  formControl: FormControl;
  @ViewChild('roomTemplate', { read: TemplateRef<unknown>, static: true })
  set _defaultContentTemplate(template: TemplateRef<unknown>) {
    this.setTemplate(template, 'roomTemplate');
  }

  constructor(
    private liveAnnouncer: LiveAnnouncer,
    private _r: Renderer2,
    protected override injector: Injector,
    protected readonly m3NavigationService: M3NavigationService,
  ) {
    super(injector);
  }

  ngAfterViewInit() {
    this.tryInitNavigation();
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    this.m3NavigationService.destroy(M3NavigationKind.Drawer);
  }

  ngAfterContentInit(): void {
    setTimeout(() => {
      document.getElementById('live_announcer-button').focus();
    }, 700);
  }

  override ngOnInit() {
    window.scroll(0, 0);
    this.initializeRoom();
    this.listenerFn = this._r.listen(document, 'keyup', (event) => {
      const lang: string = this.translateService.currentLang;
      if (
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit1) === true &&
        this.eventService.focusOnInput === false
      ) {
        document.getElementById('question_answer-button').focus();
      } else if (
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit3) === true &&
        this.eventService.focusOnInput === false
      ) {
        document.getElementById('gavel-button').focus();
      } else if (
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit4) === true &&
        this.eventService.focusOnInput === false
      ) {
        document.getElementById('settings-menu').focus();
      } else if (
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit8) === true &&
        this.eventService.focusOnInput === false
      ) {
        this.liveAnnouncer.clear();
        if (lang === 'de') {
          this.liveAnnouncer.announce(
            'Aktueller Sitzungs-Name: ' +
              this.room.name +
              '. ' +
              'Aktueller Raum-Code: ' +
              this.room.shortId,
          );
        } else {
          this.liveAnnouncer.announce(
            'Current Session-Name: ' +
              this.room.name +
              '. ' +
              'Current Session Code: ' +
              this.room.shortId,
          );
        }
      } else if (
        KeyboardUtils.isKeyEvent(
          event,
          KeyboardKey.Digit9,
          KeyboardKey.Escape,
        ) === true &&
        this.eventService.focusOnInput === false
      ) {
        this.announce();
      } else if (
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Escape) === true &&
        this.eventService.focusOnInput === true
      ) {
        this.eventService.makeFocusOnInputFalse();
      }
    });
  }

  public announce() {
    const lang: string = this.translateService.currentLang;
    this.liveAnnouncer.clear();
    if (lang === 'de') {
      this.liveAnnouncer.announce(
        'Du befindest dich in der von dir erstellten Sitzung. ' +
          'Drücke die Taste 1 um auf die Fragen-Übersicht zu gelangen, ' +
          'die Taste 2 um das Sitzungs-Menü zu öffnen, die Taste 3 um in die Moderationsübersicht zu gelangen, ' +
          'die Taste 4 um Einstellungen an der Sitzung vorzunehmen, ' +
          'die Taste 8 um den aktuellen Raum-Code zu hören, die Taste 0 um auf den Zurück-Button zu gelangen, ' +
          'oder die Taste 9 um diese Ansage zu wiederholen.',
        'assertive',
      );
    } else {
      this.liveAnnouncer.announce(
        'You are in the session you created. ' +
          'Press key 1 to go to the question overview, ' +
          'Press key 2 to open the session menu, key 3 to go to the moderation overview, ' +
          'Press key 4 to go to the session settings, ' +
          'Press the 8 for he current room code,  0 to go back, ' +
          'or press 9 to repeat this announcement.',
        'assertive',
      );
    }
  }

  openRoomSettings() {
    this.dialog.open(RoomSettingsOverviewComponent, {
      width: '800px',
    });
  }

  addTag(value: string) {
    this.room.tags.push(value);
  }

  removeTag(value: string) {
    this.room.tags.splice(this.room.tags.indexOf(value), 1);
  }

  setTemplate(template: TemplateRef<unknown>, templateName: string) {
    if (this.templateName === templateName) return;
    this.contentAnimationState = 'out';
    setTimeout(() => {
      this.templateName = templateName;
      this.contentTemplate = template;
      this.contentAnimationState = 'in';
    }, 200);
  }
}
