import { AfterContentInit, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';

import {
  CloudData,
  CloudOptions,
  Position,
  TagCloudComponent as TCloudComponent,
  ZoomOnHoverOptions
} from 'angular-tag-cloud-module';
import { CommentService } from '../../../services/http/comment.service';
import { LanguageService } from '../../../services/util/language.service';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { User } from '../../../models/user';
import { Room } from '../../../models/room';
import { NotificationService } from '../../../services/util/notification.service';
import { EventService } from '../../../services/util/event.service';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UserRole } from '../../../models/user-roles.enum';
import { RoomService } from '../../../services/http/room.service';
import { ThemeService } from '../../../../theme/theme.service';
import { TopicCloudAdministrationComponent } from '../_dialogs/topic-cloud-administration/topic-cloud-administration.component';
import { WsCommentService } from '../../../services/websockets/ws-comment.service';
import { CreateCommentWrapper } from '../../../utils/create-comment-wrapper';
import { TopicCloudAdminService } from '../../../services/util/topic-cloud-admin.service';
import { TagCloudPopUpComponent } from './tag-cloud-pop-up/tag-cloud-pop-up.component';
import { TagCloudDataService, TagCloudDataTagEntry } from '../../../services/util/tag-cloud-data.service';
import { WsRoomService } from '../../../services/websockets/ws-room.service';
import { CloudParameters, CloudTextStyle } from '../../../utils/cloud-parameters';
import { SmartDebounce } from '../../../utils/smart-debounce';
import { Theme } from '../../../../theme/Theme';

class CustomPosition implements Position {
  left: number;
  top: number;

  constructor(public relativeLeft: number,
              public relativeTop: number) {
  }

  updatePosition(width: number, height: number, metrics: TextMetrics) {
    const offsetY = (metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent) / 2;
    const offsetX = metrics.width / 2;
    this.left = width * this.relativeLeft - offsetX;
    this.top = height * this.relativeTop - offsetY;
  }
}

class TagComment implements CloudData {

  constructor(public text: string,
              public rotate: number,
              public weight: number,
              public tagData: TagCloudDataTagEntry,
              public index: number,
              public color: string = null,
              public external: boolean = false,
              public link: string = null,
              public position: Position = null,
              public tooltip: string = null) {
  }
}

const transformationScaleKiller = /scale\([^)]*\)/;
const transformationRotationKiller = /rotate\(([^)]*)\)/;

@Component({
  selector: 'app-tag-cloud',
  templateUrl: './tag-cloud.component.html',
  styleUrls: ['./tag-cloud.component.scss']
})
export class TagCloudComponent implements OnInit, OnDestroy, AfterContentInit {

  @ViewChild(TCloudComponent, { static: false }) child: TCloudComponent;
  @ViewChild(TagCloudPopUpComponent) popup: TagCloudPopUpComponent;
  @Input() user: User;
  @Input() roomId: string;
  room: Room;
  directSend = true;
  shortId: string;
  options: CloudOptions = {
    width: 1,
    height: 1,
    overflow: false,
    font: 'Not used',
    delay: 0
  };
  zoomOnHoverOptions: ZoomOnHoverOptions = {
    scale: 1.3,
    transitionTime: 0.6,
    delay: 0.4
  };
  userRole: UserRole;
  data: TagComment[] = [];
  configurationOpen = false;
  isLoading = true;
  headerInterface = null;
  themeSubscription = null;
  createCommentWrapper: CreateCommentWrapper = null;
  question = '';
  private _currentSettings: CloudParameters;
  private _subscriptionCommentlist = null;
  private _subscriptionRoom = null;
  private _calcCanvas: HTMLCanvasElement = null;
  private _calcRenderContext: CanvasRenderingContext2D = null;
  private _calcFont: string = null;
  private readonly _smartDebounce = new SmartDebounce(1, 1_000);
  private _currentTheme: Theme;

  constructor(private commentService: CommentService,
              private langService: LanguageService,
              private translateService: TranslateService,
              public dialog: MatDialog,
              private notificationService: NotificationService,
              public eventService: EventService,
              private authenticationService: AuthenticationService,
              private route: ActivatedRoute,
              protected roomService: RoomService,
              private themeService: ThemeService,
              private wsCommentService: WsCommentService,
              private topicCloudAdmin: TopicCloudAdminService,
              private router: Router,
              public dataManager: TagCloudDataService,
              private wsRoomService: WsRoomService) {
    this.roomId = localStorage.getItem('roomId');
    this.langService.langEmitter.subscribe(lang => {
      this.translateService.use(lang);
    });
    this._currentSettings = TagCloudComponent.getCurrentCloudParameters();
    this.question = this._currentSettings.question;
    this._calcCanvas = document.createElement('canvas');
    this._calcRenderContext = this._calcCanvas.getContext('2d');
  }

  private static getCurrentCloudParameters(): CloudParameters {
    return CloudParameters.currentParameters;
  }

  private static invertHex(hexStr: string) {
    const r = 255 - parseInt(hexStr.substr(1, 2), 16);
    const g = 255 - parseInt(hexStr.substr(3, 2), 16);
    const b = 255 - parseInt(hexStr.substr(5, 2), 16);
    return `#${((r * 256 + g) * 256 + b).toString(16).padStart(6, '0')}`;
  }

  ngOnInit(): void {
    this.updateGlobalStyles();
    this.headerInterface = this.eventService.on<string>('navigate').subscribe(e => {
      if (e === 'createQuestion') {
        this.createCommentWrapper.openCreateDialog(this.user);
      } else if (e === 'topicCloudConfig') {
        this.configurationOpen = !this.configurationOpen;
      } else if (e === 'topicCloudAdministration') {
        this.dialog.open(TopicCloudAdministrationComponent, {
          minWidth: '50%',
          maxHeight: '95%',
          data: {
            user: this.user
          }
        });
      } else if (e === 'questionBoard') {
        this.router.navigate(['../'], { relativeTo: this.route });
      }
    });
    this.dataManager.getData().subscribe(data => {
      if (!data) {
        return;
      }
      this.rebuildData();
    });
    this.dataManager.getMetaData().subscribe(data => {
      if (!data) {
        return;
      }
      this.eventService.broadcast('tagCloudHeaderDataOverview', data);
    });
    this.authenticationService.watchUser.subscribe(newUser => {
      if (newUser) {
        this.user = newUser;
      }
    });
    this.userRole = this.route.snapshot.data.roles[0];
    this.route.params.subscribe(params => {
      this.shortId = params['shortId'];
      this.authenticationService.checkAccess(this.shortId);
      this.authenticationService.guestLogin(UserRole.PARTICIPANT).subscribe(r => {
        this.roomService.getRoomByShortId(this.shortId).subscribe(room => {
          this.room = room;
          this.roomId = room.id;
          this._subscriptionRoom = this.wsRoomService.getRoomStream(this.roomId).subscribe(msg => {
            const message = JSON.parse(msg.body);
            if (message.type === 'RoomPatched') {
              this.room.questionsBlocked = message.payload.changes.questionsBlocked;
              this.room.blacklistIsActive = message.payload.changes.blacklistIsActive;
            }
          });
          this.directSend = this.room.directSend;
          this.createCommentWrapper = new CreateCommentWrapper(this.translateService,
            this.notificationService, this.commentService, this.dialog, this.room);
          if (!this.authenticationService.hasAccess(this.shortId, UserRole.PARTICIPANT)) {
            this.roomService.addToHistory(this.room.id);
            this.authenticationService.setAccess(this.shortId, UserRole.PARTICIPANT);
          }
        });
      });
    });
    this.translateService.use(localStorage.getItem('currentLang'));
    this.themeSubscription = this.themeService.getTheme().subscribe((themeName) => {
      this._currentTheme = this.themeService.getThemeByKey(themeName);
      if (this.child) {
        setTimeout(() => {
          this.setCloudParameters(TagCloudComponent.getCurrentCloudParameters(), false);
        }, 1);
      }
    });
  }

  ngAfterContentInit() {
    this._calcFont = window.getComputedStyle(document.getElementById('tagCloudComponent')).fontFamily;
    setTimeout(() => this.dataManager.bindToRoom(this.roomId, this.userRole));
    this.dataManager.updateDemoData(this.translateService);
    this.setCloudParameters(TagCloudComponent.getCurrentCloudParameters(), false);
  }

  ngOnDestroy() {
    const customTagCloudStyles = document.getElementById('tagCloudStyles') as HTMLStyleElement;
    if (customTagCloudStyles) {
      customTagCloudStyles.sheet.disabled = true;
    }
    this.headerInterface.unsubscribe();
    this.themeSubscription.unsubscribe();
    this.dataManager.unbindRoom();
    if (this._subscriptionRoom) {
      this._subscriptionRoom.unsubscribe();
    }
  }

  get tagCloudDataManager(): TagCloudDataService {
    return this.dataManager;
  }

  get currentCloudParameters(): CloudParameters {
    return new CloudParameters(this._currentSettings);
  }

  setCloudParameters(parameters: CloudParameters, save = true): void {
    parameters = new CloudParameters(parameters);
    const updateIntensity = this.calcUpdateIntensity(parameters);
    this._currentSettings = parameters;
    this.zoomOnHoverOptions.delay = parameters.hoverDelay;
    this.zoomOnHoverOptions.scale = parameters.hoverScale;
    this.zoomOnHoverOptions.transitionTime = parameters.hoverTime;
    if (updateIntensity >= 1) {
      this.updateGlobalStyles();
    }
    if (updateIntensity >= 2) {
      if (!this.dataManager.updateConfig(parameters)) {
        this.rebuildData();
      }
    }
    if (save) {
      CloudParameters.currentParameters = parameters;
    }
  }

  resetColorsToTheme() {
    const param = new CloudParameters();
    param.resetToDefault(this._currentTheme.isDark);
    this.setCloudParameters(param, true);
  }

  onResize(event: UIEvent): any {
    this.updateTagCloud();
  }

  rebuildData() {
    if (!this.child || !this.dataManager.currentData) {
      return;
    }
    const newElements = [];
    const data = this.dataManager.currentData;
    const countFiler = [];
    for (let i = 0; i < 10; i++) {
      countFiler.push(this._currentSettings.cloudWeightSettings[i].maxVisibleElements);
    }
    for (const [tag, tagData] of data) {
      const amount = this.dataManager.demoActive ? 10 - tagData.adjustedWeight : 1;
      for (let i = 0; i < amount; i++) {
        const remaining = countFiler[tagData.adjustedWeight];
        if (remaining !== 0) {
          if (remaining > 0) {
            --countFiler[tagData.adjustedWeight];
          }
          let rotation = this._currentSettings.cloudWeightSettings[tagData.adjustedWeight].rotation;
          if (rotation === null || this._currentSettings.randomAngles) {
            rotation = Math.floor(Math.random() * 30 - 15);
          }
          newElements.push(new TagComment(tag, rotation, tagData.weight, tagData, newElements.length));
        }
      }
    }
    if (this._currentSettings.sortAlphabetically) {
      const lines = Math.floor(Math.sqrt(newElements.length - 1) + 1);
      const divided = Math.floor(newElements.length / lines);
      let remainder = newElements.length - divided * lines;
      for (let i = 0, line = 0; line < lines; line++) {
        const size = divided + (--remainder >= 0 ? 1 : 0);
        for (let k = 0; k < size; k++, i++) {
          newElements[i].position = new CustomPosition((k + 1) / (size + 1), (line + 1) / (lines + 1));
        }
      }
      this.updateAlphabeticalPosition(newElements);
    }
    this.data = newElements;
    setTimeout(() => {
      this.updateTagCloud(true);
    }, 2);
  }

  updateTagCloud(dataUpdated = false) {
    this.isLoading = true;
    if (this._currentSettings.sortAlphabetically && this.data.length) {
      this.updateAlphabeticalPosition(this.data);
    }
    this._smartDebounce.call(() => this.redraw(dataUpdated));
  }

  openTags(tag: CloudData): void {
    if (this.dataManager.demoActive || this._subscriptionCommentlist !== null) {
      return;
    }
    this._subscriptionCommentlist = this.eventService.on('commentListCreated').subscribe(() => {
      this.eventService.broadcast('setTagConfig', tag.text);
      this._subscriptionCommentlist.unsubscribe();
    });
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  private updateAlphabeticalPosition(elements: TagComment[]): void {
    const sizes = new Array(10);
    const fontRange = (this._currentSettings.fontSizeMax - this._currentSettings.fontSizeMin) / 10;
    for (let i = 1; i <= 10; i++) {
      sizes[i - 1] = (this._currentSettings.fontSizeMin + fontRange * i).toFixed(0) + '%';
    }
    const width = this.child.calculatedWidth;
    const height = this.child.calculatedHeight;
    elements.forEach((e, i) => {
      this._calcRenderContext.font = sizes[e.tagData.adjustedWeight] + ' ' + this._calcFont;
      (e.position as CustomPosition).updatePosition(width, height, this._calcRenderContext.measureText(e.text));
    });
  }

  private redraw(dataUpdate: boolean): void {
    if (this.child === undefined) {
      return;
    }
    this.isLoading = false;
    if (!dataUpdate) {
      this.child.reDraw();
    }
    if (this.dataManager.currentData === null) {
      return;
    }
    this.child.cloudDataHtmlElements.forEach((elem, i) => {
      const dataElement = this.data[i];
      elem.addEventListener('mouseleave', () => {
        elem.style.transform = elem.style.transform.replace(transformationScaleKiller, '').trim() +
          ' rotate(' + (elem.dataset['tempRotation'] || '0deg') + ')';
        this.popup.leave();
      });
      elem.addEventListener('mouseenter', () => {
        const transformMatch = elem.style.transform.match(transformationRotationKiller);
        elem.dataset['tempRotation'] = transformMatch ? transformMatch[1] : '0deg';
        elem.style.transform = elem.style.transform.replace(transformationRotationKiller, '').trim();
        this.popup.enter(elem, dataElement.text, dataElement.tagData,
          (this._currentSettings.hoverTime + this._currentSettings.hoverDelay) * 1_000,
          this.room && this.room.blacklistIsActive);
      });
    });
  }

  private updateGlobalStyles(): void {
    let customTagCloudStyles = document.getElementById('tagCloudStyles') as HTMLStyleElement;
    if (!customTagCloudStyles) {
      customTagCloudStyles = document.createElement('style');
      customTagCloudStyles.id = 'tagCloudStyles';
      document.head.appendChild(customTagCloudStyles);
    }
    customTagCloudStyles.sheet.disabled = false;
    const rules = customTagCloudStyles.sheet.cssRules;
    for (let i = rules.length - 1; i >= 0; i--) {
      customTagCloudStyles.sheet.deleteRule(i);
    }
    let textTransform = '';
    let plainTextTransform = 'unset';
    if (this._currentSettings.textTransform === CloudTextStyle.capitalized) {
      textTransform = 'text-transform: capitalize;';
      plainTextTransform = 'capitalize';
    } else if (this._currentSettings.textTransform === CloudTextStyle.lowercase) {
      textTransform = 'text-transform: lowercase;';
      plainTextTransform = 'lowercase';
    } else if (this._currentSettings.textTransform === CloudTextStyle.uppercase) {
      textTransform = 'text-transform: uppercase;';
      plainTextTransform = 'uppercase';
    }
    customTagCloudStyles.sheet.insertRule('.spacyTagCloud > span, .spacyTagCloud > span > a { ' +
      textTransform + ' font-family: ' + this._currentSettings.fontFamily + '; ' +
      'font-size: ' + this._currentSettings.fontSize + '; ' +
      'font-weight: ' + this._currentSettings.fontWeight + '; ' +
      'font-style:' + this._currentSettings.fontStyle + '; }');
    const fontRange = (this._currentSettings.fontSizeMax - this._currentSettings.fontSizeMin) / 10;
    for (let i = 1; i <= 10; i++) {
      customTagCloudStyles.sheet.insertRule('.spacyTagCloud > span.w' + i + ', ' +
        '.spacyTagCloud > span.w' + i + ' > a { ' +
        'color: ' + this._currentSettings.cloudWeightSettings[i - 1].color + '; ' +
        'font-size: ' + (this._currentSettings.fontSizeMin + fontRange * i).toFixed(0) + '%; }');
    }
    customTagCloudStyles.sheet.insertRule('.spacyTagCloud > span:hover, .spacyTagCloud > span:hover > a { ' +
      'color: ' + this._currentSettings.fontColor + ' !important; ' +
      'background-color: ' + this._currentSettings.backgroundColor + '; }');
    customTagCloudStyles.sheet.insertRule('.spacyTagCloudContainer { ' +
      'background-color: ' + this._currentSettings.backgroundColor + '; }');
    const invertedBackground = TagCloudComponent.invertHex(this._currentSettings.backgroundColor);
    customTagCloudStyles.sheet.insertRule(':root { ' +
      '--tag-cloud-inverted-background: ' + invertedBackground + ';' +
      '--tag-cloud-transform: ' + plainTextTransform + ';' +
      '--tag-cloud-background-color: ' + this._currentSettings.backgroundColor + ';' +
      '--tag-cloud-font-weight: ' + this._currentSettings.fontWeight + ';' +
      '--tag-cloud-font-style: ' + this._currentSettings.fontStyle + ';' +
      '--tag-cloud-font-family: ' + this._currentSettings.fontFamily + '; }');
    customTagCloudStyles.sheet.insertRule('.header-icons { ' +
      'color: var(--tag-cloud-inverted-background) !important; }');
    customTagCloudStyles.sheet.insertRule('.header .oldtypo-h2, .header .oldtypo-h2 + span { ' +
      'color: var(--tag-cloud-inverted-background) !important; }');
    customTagCloudStyles.sheet.insertRule('#footer_rescale {' +
      'display: none; }');
    customTagCloudStyles.sheet.insertRule('div.main_container {' +
      'background-color: var(--tag-cloud-background-color) !important; }');
  }

  /**
   * 0 = update nothing,
   * 1 = update css,
   * 2 = update data
   */
  private calcUpdateIntensity(parameters: CloudParameters): number {
    if (!this._currentSettings) {
      return 2;
    }
    const cssUpdates = ['backgroundColor', 'fontColor'];
    const dataUpdates = ['randomAngles', 'sortAlphabetically',
      'fontSizeMin', 'fontSizeMax', 'textTransform', 'fontStyle', 'fontWeight', 'fontFamily', 'fontSize'];
    const cssWeightUpdates = ['color'];
    const dataWeightUpdates = ['maxVisibleElements', 'rotation'];
    for (const key of dataUpdates) {
      if (this._currentSettings[key] !== parameters[key]) {
        return 2;
      }
    }
    for (let i = 0; i < 10; i++) {
      for (const key of dataWeightUpdates) {
        if (this._currentSettings.cloudWeightSettings[i][key] !== parameters.cloudWeightSettings[i][key]) {
          return 2;
        }
      }
    }
    for (const key of cssUpdates) {
      if (this._currentSettings[key] !== parameters[key]) {
        return 1;
      }
    }
    for (let i = 0; i < 10; i++) {
      for (const key of cssWeightUpdates) {
        if (this._currentSettings.cloudWeightSettings[i][key] !== parameters.cloudWeightSettings[i][key]) {
          return 1;
        }
      }
    }
    return 0;
  }
}
