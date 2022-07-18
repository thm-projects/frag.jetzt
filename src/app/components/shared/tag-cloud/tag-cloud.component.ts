import { AfterContentInit, Component, ComponentRef, EventEmitter, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { CloudData, CloudOptions, Position, ZoomOnHoverOptions } from 'angular-tag-cloud-module';
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
import { TopicCloudAdminService } from '../../../services/util/topic-cloud-admin.service';
import { TagCloudPopUpComponent } from './tag-cloud-pop-up/tag-cloud-pop-up.component';
import { TagCloudDataService, TagCloudDataTagEntry } from '../../../services/util/tag-cloud-data.service';
import { CloudParameters } from '../../../utils/cloud-parameters';
import { SmartDebounce } from '../../../utils/smart-debounce';
import { MatDrawer } from '@angular/material/sidenav';
import { DeviceInfoService } from '../../../services/util/device-info.service';
import { ActiveWord, WordCloudComponent, WordMeta } from './word-cloud/word-cloud.component';
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
import { RoomDataService } from '../../../services/util/room-data.service';
import { FilterType, Period, RoomDataFilter } from '../../../utils/data-filter-object.lib';
import { maskKeyword } from '../../../services/util/tag-cloud-data.util';
import { FilteredDataAccess } from '../../../utils/filtered-data-access';
import { forkJoin, Subscription } from 'rxjs';

class TagComment implements CloudData, WordMeta {

  constructor(
    public text: string,
    public realText: string,
    public rotate: number,
    public weight: number,
    public tagData: TagCloudDataTagEntry,
    public index: number,
    public color: string = null,
    public external: boolean = false,
    public link: string = null,
    public position: Position = null,
    public tooltip: string = null
  ) {
  }
}

@Component({
  selector: 'app-tag-cloud',
  templateUrl: './tag-cloud.component.html',
  styleUrls: ['./tag-cloud.component.scss']
})
export class TagCloudComponent implements OnInit, OnDestroy, AfterContentInit {

  @ViewChild(WordCloudComponent, { static: false }) cloud: WordCloudComponent<TagComment>;
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
  createCommentWrapper: CreateCommentWrapper = null;
  brainstormingData: BrainstormingSession;
  brainstormingActive: boolean;
  private _currentSettings: CloudParameters;
  private _subscriptionRoom = null;
  private readonly _smartDebounce = new SmartDebounce(50, 1_000);
  private themeSubscription: Subscription;

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
  }

  get tagCloudDataManager(): TagCloudDataService {
    return this.dataManager;
  }

  get currentCloudParameters(): CloudParameters {
    return new CloudParameters(this._currentSettings);
  }

  ngOnInit(): void {
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
    forkJoin([
      this.sessionService.getRoomOnce(),
      this.sessionService.getModeratorsOnce(),
    ]).subscribe(([room, mods]) => {
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
      let filterObj: FilteredDataAccess;
      if (this.brainstormingActive) {
        filterObj = FilteredDataAccess.buildNormalAccess(this.sessionService, this.roomDataService, true, false, 'brainstorming');
      } else {
        filterObj = FilteredDataAccess.buildNormalAccess(this.sessionService, this.roomDataService, true, false, 'tagCloud');
      }
      filterObj.attach({
        moderatorIds: new Set<string>(mods.map(m => m.accountId)),
        threshold: room.threshold,
        ownerId: room.ownerId,
        roomId: room.id,
        userId: this.user.id,
      });
      if (this.brainstormingActive) {
        const filter = filterObj.dataFilter;
        filter.resetToDefault();
        filter.timeFilterStart = new Date(room.brainstormingSession.createdAt).getTime();
        filter.save();
        filterObj.dataFilter = filter;
      }
      this.dataManager.filterObject = filterObj;
    });
    this.themeSubscription = this.themeService.getTheme().subscribe(_ => {
      if (this.cloud) {
        setTimeout(() => {
          this.setCloudParameters(this.getCurrentCloudParameters(), false);
        }, 1);
      }
    });
  }

  ngAfterContentInit() {
    this.initNavigation();
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
    this.createCommentWrapper.openCreateDialog(this.user, this.userRole,
      this.brainstormingActive && this.brainstormingData).subscribe();
  }

  rebuildData() {
    if (!this.cloud || !this.dataManager.currentData) {
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
        this.createTagElement(countFiler, tagData, tag, newElements);
      }
    }
    this.data = newElements;
    setTimeout(() => {
      this.updateTagCloud(true);
    }, 2);
  }

  updateTagCloud(dataUpdated = false) {
    this.isLoading = true;
    this._smartDebounce.call(() => this.redraw(dataUpdated));
  }

  openTags(tag: CloudData): void {
    if (this.brainstormingActive || this.dataManager.demoActive) {
      return;
    }
    //Room filter
    const filter = RoomDataFilter.loadFilter('commentList');
    filter.resetToDefault();
    filter.lastRoomId = this.room.id;
    filter.period = Period.All;
    filter.filterType = FilterType.Keyword;
    filter.filterCompare = (tag as TagComment).realText;
    filter.save();
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  updateTagCloudSettings() {
    if (!this.user || this.user.role === UserRole.PARTICIPANT) {
      throw new Error('user has no rights.');
    }
    const tagCloudSettings = TagCloudSettings.getCurrent(this.themeService.currentTheme.isDark).serialize();
    this.roomService.patchRoom(this.room.id, { tagCloudSettings }).subscribe({
      next: () => {
        this.translateService.get('tag-cloud.changes-successful').subscribe(msg => {
          this.notificationService.show(msg);
        });
      },
      error: (error) => {
        this.translateService.get('tag-cloud.changes-gone-wrong').subscribe(msg => {
          this.notificationService.show(msg);
        });
      }
    });
  }

  isCloudEmpty() {
    return !this.data?.length;
  }

  enter(word: ActiveWord<TagComment>) {
    this.popup.enter(word.element, word.meta.text, this.brainstormingActive, word.meta.tagData,
      (this._currentSettings.hoverTime + this._currentSettings.hoverDelay) * 1_000,
      this.room && this.room.blacklistActive);
  }

  leave() {
    this.popup.leave();
  }

  private createTagElement(countFiler: number[], tagData: TagCloudDataTagEntry, tag: string, newElements: TagComment[]) {
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
        filteredTag = filteredTag.substring(0, this.brainstormingData.maxWordLength - 1) + '…';
      }
      newElements.push(new TagComment(filteredTag, tag, rotation, tagData.weight, tagData, newElements.length));
    }
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

  private initNavigation() {
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
        icon: 'print',
        class: 'material-icons-outlined',
        text: 'header.tag-cloud-screenshot',
        callback: () => {
          if (!this.cloud?.wordCloud) {
            this.translateService.get('tag-cloud.no-elements')
              .subscribe(msg => this.notificationService.show(msg));
            return;
          }
          this.translateService.get('tag-cloud.print-title', { roomName: this.room.name })
            .subscribe(msg => DOMElementPrinter.printOnce(this.cloud?.wordCloud.nativeElement,
              msg, this._currentSettings.backgroundColor));
        },
        condition: () => true
      });
      e.menuItem({
        translate: this.headerService.getTranslate(),
        icon: 'cloud',
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
  }

  private redraw(dataUpdate: boolean): void {
    if (this.cloud === undefined) {
      return;
    }
    this.isLoading = false;
    if (!dataUpdate) {
      this.cloud.redraw();
    }
  }

  /**
   * 0 = update nothing,
   * 2 = update data
   */
  private calcUpdateIntensity(parameters: CloudParameters): number {
    if (!this._currentSettings) {
      return 2;
    }
    const dataUpdates = ['randomAngles', 'sortAlphabetically',
      'fontSizeMin', 'fontSizeMax', 'textTransform', 'fontStyle', 'fontWeight', 'fontFamily', 'fontSize'];
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
    return 0;
  }
}
