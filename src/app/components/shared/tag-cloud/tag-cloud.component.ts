import { AfterContentInit, Component, ComponentRef, EventEmitter, OnDestroy, OnInit, ViewChild } from '@angular/core';

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
import { AuthenticationService } from '../../../services/http/authentication.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UserRole } from '../../../models/user-roles.enum';
import { RoomService } from '../../../services/http/room.service';
import { ThemeService } from '../../../../theme/theme.service';
import {
  TopicCloudAdministrationComponent
} from '../_dialogs/topic-cloud-administration/topic-cloud-administration.component';
import { WsCommentService } from '../../../services/websockets/ws-comment.service';
import { CreateCommentWrapper } from '../../../utils/create-comment-wrapper';
import { maskKeyword, TopicCloudAdminService } from '../../../services/util/topic-cloud-admin.service';
import { TagCloudPopUpComponent } from './tag-cloud-pop-up/tag-cloud-pop-up.component';
import { TagCloudDataService, TagCloudDataTagEntry } from '../../../services/util/tag-cloud-data.service';
import { CloudParameters, CloudTextStyle } from '../../../utils/cloud-parameters';
import { SmartDebounce } from '../../../utils/smart-debounce';
import { MatDrawer } from '@angular/material/sidenav';
import { DeviceInfoService } from '../../../services/util/device-info.service';
import { ArsComposeService } from '../../../../../projects/ars/src/lib/services/ars-compose.service';
import { HeaderService } from '../../../services/util/header.service';
import { WorkerConfigDialogComponent } from '../_dialogs/worker-config-dialog/worker-config-dialog.component';
import { TagCloudSettings } from '../../../utils/TagCloudSettings';
import { SessionService } from '../../../services/util/session.service';
import { DOMElementPrinter } from '../../../utils/DOMElementPrinter';
import { BrainstormingSession } from '../../../models/brainstorming-session';
import {
  IntroductionTagCloudComponent
} from '../_dialogs/introductions/introduction-tag-cloud/introduction-tag-cloud.component';
import {
  IntroductionBrainstormingComponent
} from '../_dialogs/introductions/introduction-brainstorming/introduction-brainstorming.component';
import { ComponentType } from '@angular/cdk/overlay';
import { DataFilterObject } from '../../../utils/data-filter-object';
import { RoomDataService } from '../../../services/util/room-data.service';
import { FilterType, Period, RoomDataFilter } from '../../../utils/data-filter-object.lib';

class CustomPosition implements Position {
  left: number;
  top: number;

  constructor(public relativeLeft: number,
              public relativeTop: number) {
  }

  updatePosition(width: number, height: number, metrics: TextMetrics) {
    const offsetY = (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) / 2;
    const offsetX = metrics.width / 2;
    this.left = width * this.relativeLeft - offsetX;
    this.top = height * this.relativeTop - offsetY;
  }
}

class TagComment implements CloudData {

  constructor(public text: string,
              public realText: string,
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
  @ViewChild(MatDrawer) drawer: MatDrawer;

  onDestroyListener: EventEmitter<void> = new EventEmitter<void>();
  roomId: string;
  user: User;
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
  isLoading = true;
  themeSubscription = null;
  createCommentWrapper: CreateCommentWrapper = null;
  brainstormingData: BrainstormingSession;
  brainstormingActive: boolean;
  private _currentSettings: CloudParameters;
  private _subscriptionRoom = null;
  private _calcCanvas: HTMLCanvasElement = null;
  private _calcRenderContext: CanvasRenderingContext2D = null;
  private _calcFont: string = null;
  private readonly _smartDebounce = new SmartDebounce(50, 1_000);

  constructor(
    private commentService: CommentService,
    private langService: LanguageService,
    private translateService: TranslateService,
    public dialog: MatDialog,
    private notificationService: NotificationService,
    private authenticationService: AuthenticationService,
    private composeService: ArsComposeService,
    private headerService: HeaderService,
    private route: ActivatedRoute,
    protected roomService: RoomService,
    private themeService: ThemeService,
    private wsCommentService: WsCommentService,
    private topicCloudAdmin: TopicCloudAdminService,
    private sessionService: SessionService,
    private router: Router,
    public dataManager: TagCloudDataService,
    private deviceInfo: DeviceInfoService,
    private roomDataService: RoomDataService,
  ) {
    this.langService.getLanguage().subscribe(lang => {
      this.translateService.use(lang);
    });
    this._currentSettings = this.getCurrentCloudParameters();
    this._calcCanvas = document.createElement('canvas');
    this._calcRenderContext = this._calcCanvas.getContext('2d');
  }

  get tagCloudDataManager(): TagCloudDataService {
    return this.dataManager;
  }

  get currentCloudParameters(): CloudParameters {
    return new CloudParameters(this._currentSettings);
  }

  private static invertHex(hexStr: string) {
    const r = 255 - parseInt(hexStr.substr(1, 2), 16);
    const g = 255 - parseInt(hexStr.substr(3, 2), 16);
    const b = 255 - parseInt(hexStr.substr(5, 2), 16);
    return `#${((r * 256 + g) * 256 + b).toString(16).padStart(6, '0')}`;
  }

  ngOnInit(): void {
    const filterObj = new DataFilterObject('tagCloud', this.roomDataService,
      this.authenticationService, this.sessionService);
    this.dataManager.filterObject = filterObj;
    this.updateGlobalStyles();
    this.dataManager.getData().subscribe(data => {
      if (!data) {
        return;
      }
      this.rebuildData();
    });
    this.authenticationService.watchUser.subscribe(newUser => {
      if (newUser) {
        this.user = newUser;
      }
    });
    this.route.data.subscribe(d => this.brainstormingActive = !!d.brainstorming);
    this.sessionService.getRoomOnce().subscribe(room => {
      this.userRole = this.sessionService.currentRole;
      this.shortId = room.shortId;
      this.roomId = room.id;
      this.room = room;
      this.sessionService.receiveRoomUpdates().subscribe(() => {
        this.retrieveTagCloudSettings(room);
      });
      this.retrieveTagCloudSettings(room);
      this.directSend = this.room.directSend;
      this.createCommentWrapper = new CreateCommentWrapper(this.translateService,
        this.notificationService, this.commentService, this.dialog, this.room);
      if (this.brainstormingActive) {
        const filter = new RoomDataFilter(null);
        filter.filterType = FilterType.brainstormingQuestion;
        filter.period = Period.fromNow;
        filter.lastRoomId = room.id;
        filter.fromNow = new Date(room.brainstormingSession.createdAt).getTime();
        filter.save('tagCloud');
        filterObj.filter = filter;
      }
    });
    this.themeSubscription = this.themeService.getTheme().subscribe(() => {
      if (this.child) {
        setTimeout(() => {
          this.setCloudParameters(this.getCurrentCloudParameters(), false);
        }, 1);
      }
    });
  }

  ngAfterContentInit() {
    this.initNavigation();
    this._calcFont = window.getComputedStyle(document.getElementById('tagCloudComponent')).fontFamily;
    this.dataManager.updateDemoData(this.translateService);
    this.setCloudParameters(this.getCurrentCloudParameters(), false);
  }

  ngOnDestroy() {
    this.dataManager.unloadCloud();
    const customTagCloudStyles = document.getElementById('tagCloudStyles') as HTMLStyleElement;
    if (customTagCloudStyles) {
      customTagCloudStyles.sheet.disabled = true;
    }
    this.themeSubscription.unsubscribe();
    if (this._subscriptionRoom) {
      this._subscriptionRoom.unsubscribe();
    }
    this.onDestroyListener.emit();
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
    param.resetToDefault(this.themeService.currentTheme.isDark);
    this.setCloudParameters(param, false);
    CloudParameters.removeParameters();
  }

  onResize(event: UIEvent): any {
    this.updateTagCloud();
  }

  canWriteComment(): boolean {
    if ((!this.room || this.room.questionsBlocked) && this.userRole === UserRole.PARTICIPANT) {
      return false;
    }
    return !(this.brainstormingActive && !(this.brainstormingData?.active));
  }

  startIntroduction() {
    const type: ComponentType<any> = this.brainstormingActive ? IntroductionBrainstormingComponent : IntroductionTagCloudComponent;
    this.dialog.open(type, {
      autoFocus: false
    });
  }

  writeComment() {
    if (!this.canWriteComment()) {
      return;
    }
    this.createCommentWrapper.openCreateDialog(this.user, this.userRole, this.brainstormingData).subscribe();
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
          let filteredTag = maskKeyword(tag);
          if (this.brainstormingActive && filteredTag.length > this.brainstormingData.maxWordLength) {
            filteredTag = filteredTag.substr(0, this.brainstormingData.maxWordLength - 1) + '…';
          }
          newElements.push(new TagComment(filteredTag, tag, rotation, tagData.weight, tagData, newElements.length));
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
    if (this.brainstormingActive || this.dataManager.demoActive) {
      return;
    }
    //Room filter
    const filter = new RoomDataFilter(null);
    filter.lastRoomId = this.room.id;
    filter.period = Period.all;
    filter.filterType = FilterType.keyword;
    filter.filterCompare = (tag as TagComment).realText;
    filter.save('commentList');
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  updateTagCloudSettings() {
    if (!this.user || this.user.role === UserRole.PARTICIPANT) {
      throw new Error('user has no rights.');
    }
    TagCloudSettings.getCurrent(this.themeService.currentTheme.isDark).applyToRoom(this.room);
    this.roomService.updateRoom(this.room).subscribe(_ => {
        this.translateService.get('tag-cloud.changes-successful').subscribe(msg => {
          this.notificationService.show(msg);
        });
      },
      error => {
        this.translateService.get('tag-cloud.changes-gone-wrong').subscribe(msg => {
          this.notificationService.show(msg);
        });
      });
  }

  isCloudEmpty() {
    return !this.data?.length;
  }

  private getCurrentCloudParameters(): CloudParameters {
    return CloudParameters.getCurrentParameters(this.themeService.currentTheme.isDark);
  }

  private retrieveTagCloudSettings(room: Room) {
    const settings = TagCloudSettings.getFromRoom(room);
    if (this.brainstormingActive && (!room.brainstormingSession ||
      this.brainstormingData && this.brainstormingData.active !== room.brainstormingSession.active)) {
      this.router.navigate(['../'], {
        relativeTo: this.route
      });
      return;
    }
    this.brainstormingData = room.brainstormingSession;
    if (!settings) {
      this.resetColorsToTheme();
      this.setCloudParameters(this.currentCloudParameters);
      if (this.userRole > UserRole.PARTICIPANT) {
        this.updateTagCloudSettings();
      }
      return;
    }
    this.topicCloudAdmin.setAdminData(settings.adminData, null, this.userRole);
    const data = settings.settings;
    if (this.deviceInfo.isCurrentlyMobile) {
      const defaultParams = new CloudParameters();
      defaultParams.resetToDefault(this.themeService.currentTheme.isDark);
      data.fontSizeMin = defaultParams.fontSizeMin;
      data.fontSizeMax = defaultParams.fontSizeMax;
    }
    this.setCloudParameters(data);
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

  private initNavigation() {
    /* eslint-disable @typescript-eslint/no-shadow */
    const list: ComponentRef<any>[] = this.composeService.builder(this.headerService.getHost(), e => {
      e.menuItem({
        translate: this.headerService.getTranslate(),
        icon: 'forum',
        class: 'material-icons-outlined',
        text: 'header.back-to-questionboard',
        callback: () => this.router.navigate(['../'], { relativeTo: this.route }),
        condition: () => true
      });
      e.menuItem({
        translate: this.headerService.getTranslate(),
        icon: 'tag',
        class: 'material-icons-outlined',
        text: 'header.tag-cloud-screenshot',
        callback: () => {
          if (!this.child?.cloudDataHtmlElements?.length) {
            this.translateService.get('tag-cloud.tag-cloud-no-elements')
              .subscribe(msg => this.notificationService.show(msg));
            return;
          }
          this.translateService.get('tag-cloud.tag-cloud-print-title', { roomName: this.room.name })
            .subscribe(msg => DOMElementPrinter.printOnce(this.child?.cloudDataHtmlElements[0].parentElement,
              msg, this._currentSettings.backgroundColor));
        },
        condition: () => true
      });
      e.menuItem({
        translate: this.headerService.getTranslate(),
        icon: 'tag',
        class: 'material-icons-outlined',
        text: 'header.tag-cloud-config',
        callback: () => this.drawer.toggle(),
        condition: () => this.userRole > UserRole.PARTICIPANT
      });
      e.menuItem({
        translate: this.headerService.getTranslate(),
        icon: 'handyman',
        class: 'material-icons-outlined',
        text: 'header.tag-cloud-administration',
        callback: () => this.dialog.open(TopicCloudAdministrationComponent, {
          minWidth: '50%',
          maxHeight: '95%',
          data: {
            userRole: this.userRole
          }
        }),
        condition: () => this.userRole > UserRole.PARTICIPANT && !this.brainstormingActive
      });
      e.menuItem({
        translate: this.headerService.getTranslate(),
        icon: 'auto_fix_high',
        class: 'material-icons-outlined',
        text: 'header.update-spacy-keywords',
        callback: () => WorkerConfigDialogComponent.addTask(this.dialog, this.room),
        condition: () => this.userRole > UserRole.PARTICIPANT && !this.brainstormingActive
      });
    });
    this.onDestroyListener.subscribe(() => {
      list.forEach(e => e.destroy());
    });
    /* eslint-enable @typescript-eslint/no-shadow */
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
        this.popup.enter(elem, dataElement.realText, this.brainstormingActive, dataElement.tagData,
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
    customTagCloudStyles.sheet.insertRule('.header-icons, .header-icons + h2 { ' +
      'color: var(--tag-cloud-inverted-background) !important; }');
    customTagCloudStyles.sheet.insertRule('.header .oldtypo-h2, .header .oldtypo-h2 + span { ' +
      'color: var(--tag-cloud-inverted-background) !important; }');
    customTagCloudStyles.sheet.insertRule('#footer_rescale {' +
      'display: none; }');
    customTagCloudStyles.sheet.insertRule('div.main_container, app-header > mat-toolbar {' +
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
