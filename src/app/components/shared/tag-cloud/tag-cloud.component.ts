import {
  AfterContentInit,
  Component,
  ComponentRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';

import { CloudOptions, ZoomOnHoverOptions } from 'angular-tag-cloud-module';
import { CommentService } from '../../../services/http/comment.service';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { User } from '../../../models/user';
import { Room } from '../../../models/room';
import { NotificationService } from '../../../services/util/notification.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UserRole } from '../../../models/user-roles.enum';
import { RoomService } from '../../../services/http/room.service';
import { ThemeService } from '../../../../theme/theme.service';
import { TopicCloudAdministrationComponent } from '../_dialogs/topic-cloud-administration/topic-cloud-administration.component';
import { WsCommentService } from '../../../services/websockets/ws-comment.service';
import { CreateCommentWrapper } from '../../../utils/create-comment-wrapper';
import { TopicCloudAdminService } from '../../../services/util/topic-cloud-admin.service';
import { TagCloudPopUpComponent } from './tag-cloud-pop-up/tag-cloud-pop-up.component';
import {
  TagCloudDataService,
  TagCloudDataTagEntry,
} from '../../../services/util/tag-cloud-data.service';
import { CloudParameters } from '../../../utils/cloud-parameters';
import { SmartDebounce } from '../../../utils/smart-debounce';
import { MatDrawer } from '@angular/material/sidenav';
import { DeviceInfoService } from '../../../services/util/device-info.service';
import {
  ActiveWord,
  WordCloudComponent,
  WordMeta,
} from './word-cloud/word-cloud.component';
import { ArsComposeService } from '../../../../../projects/ars/src/lib/services/ars-compose.service';
import { HeaderService } from '../../../services/util/header.service';
import { WorkerConfigDialogComponent } from '../_dialogs/worker-config-dialog/worker-config-dialog.component';
import { TagCloudSettings } from '../../../utils/TagCloudSettings';
import { SessionService } from '../../../services/util/session.service';
import { BrainstormingSession } from '../../../models/brainstorming-session';
import { IntroductionTagCloudComponent } from '../_dialogs/introductions/introduction-tag-cloud/introduction-tag-cloud.component';
import {
  IntroductionBrainstormingComponent,
} from '../_dialogs/introductions/introduction-brainstorming/introduction-brainstorming.component';
import { ComponentType } from '@angular/cdk/overlay';
import { RoomDataService } from '../../../services/util/room-data.service';
import {
  BrainstormingFilter,
  FilterType,
  Period,
  RoomDataFilter,
} from '../../../utils/data-filter-object.lib';
import { maskKeyword } from '../../../services/util/tag-cloud-data.util';
import { FilteredDataAccess } from '../../../utils/filtered-data-access';
import { forkJoin, Subscription, switchMap } from 'rxjs';
import { UserManagementService } from '../../../services/util/user-management.service';
import { BrainstormingBlacklistEditComponent } from '../_dialogs/brainstorming-blacklist-edit/brainstorming-blacklist-edit.component';
import { BrainstormingTopic } from 'app/services/util/brainstorming-data-builder';
import { BrainstormingDataService } from 'app/services/util/brainstorming-data.service';
import { ArsObserver } from '../../../../../projects/ars/src/lib/models/util/ars-observer';
import { BrainstormingCategoryEditorComponent } from '../_dialogs/brainstorming-category-editor/brainstorming-category-editor.component';
import { BrainstormingService } from 'app/services/http/brainstorming.service';
import { BrainstormingEditComponent } from '../_dialogs/brainstorming-edit/brainstorming-edit.component';
import { TimeoutHelper } from 'app/utils/ts-utils';
import { BrainstormingDeleteConfirmComponent } from '../_dialogs/brainstorming-delete-confirm/brainstorming-delete-confirm.component';
import {
  copyCSVString,
  exportBrainstorming,
} from 'app/utils/ImportExportMethods';
import { BonusTokenService } from 'app/services/http/bonus-token.service';

class TagComment implements WordMeta {
  constructor(
    public text: string,
    public realText: string,
    public rotate: number,
    public weight: number,
    public tagData: TagCloudDataTagEntry,
    public index: number,
  ) {}
}

class BrainstormComment implements WordMeta {
  constructor(
    public text: string,
    public realText: string,
    public rotate: number,
    public weight: number,
    public brainData: BrainstormingTopic,
    public index: number,
    public wordId: string,
  ) {}
}

@Component({
  selector: 'app-tag-cloud',
  templateUrl: './tag-cloud.component.html',
  styleUrls: ['./tag-cloud.component.scss'],
})
export class TagCloudComponent implements OnInit, OnDestroy, AfterContentInit {
  @ViewChild(WordCloudComponent, { static: false })
  cloud: WordCloudComponent<TagComment>;
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
    delay: 0,
  };
  zoomOnHoverOptions: ZoomOnHoverOptions = {
    scale: 1.3,
    transitionTime: 0.6,
    delay: 0.4,
  };
  userRole: UserRole;
  data: (TagComment | BrainstormComment)[] = [];
  isLoading = true;
  createCommentWrapper: CreateCommentWrapper = null;
  brainstormingData: BrainstormingSession;
  brainstormingActive: boolean;
  private _currentSettings: CloudParameters;
  private _subscriptionRoom = null;
  private readonly _smartDebounce = new SmartDebounce(50, 1_000);
  private intervalWriteChecker: TimeoutHelper;
  private themeSubscription: Subscription;

  constructor(
    private commentService: CommentService,
    private translateService: TranslateService,
    public dialog: MatDialog,
    private notificationService: NotificationService,
    private userManagementService: UserManagementService,
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
    public brainDataManager: BrainstormingDataService,
    private deviceInfo: DeviceInfoService,
    private roomDataService: RoomDataService,
    private brainstormingService: BrainstormingService,
    private bonusTokenService: BonusTokenService,
  ) {}

  get tagCloudDataManager(): TagCloudDataService {
    return this.dataManager;
  }

  get currentCloudParameters(): CloudParameters {
    return new CloudParameters(this._currentSettings);
  }

  ngOnInit(): void {
    this.sessionService.onReady.subscribe(() => {
      this.route.data.subscribe((d) => {
        this.brainstormingActive = Boolean(d.brainstorming);
        if (this.brainstormingActive) {
          this.initBrainstorming();
        } else {
          this.init();
        }
      });
    });
  }

  ngAfterContentInit() {
    this.sessionService.onReady.subscribe(() => {
      this.initNavigation();
      this.dataManager.updateDemoData(this.translateService);
      this.setCloudParameters(this.getCurrentCloudParameters(), false);
    });
  }

  ngOnDestroy() {
    this.dataManager.unloadCloud();
    const customTagCloudStyles = document.getElementById(
      'tagCloudStyles',
    ) as HTMLStyleElement;
    if (customTagCloudStyles) {
      customTagCloudStyles.sheet.disabled = true;
    }
    this.themeSubscription?.unsubscribe();
    this._subscriptionRoom?.unsubscribe();
    this.onDestroyListener.emit();
    clearInterval(this.intervalWriteChecker);
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
        if (this.brainstormingActive) {
          this.rebuildBrainstormingData();
        } else {
          this.rebuildData();
        }
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

  canWriteComment(ignoreInternal = false): boolean {
    if (
      (!this.room || this.room.questionsBlocked) &&
      this.userRole === UserRole.PARTICIPANT
    ) {
      return false;
    }
    const canWrite =
      !this.brainstormingData?.ideasFrozen &&
      (ignoreInternal ||
        this.brainstormingData?.ideasEndTimestamp === null ||
        this.brainstormingData?.ideasEndTimestamp?.getTime() >= Date.now());
    return (
      this.brainstormingActive &&
      Boolean(this.brainstormingData?.active) &&
      (canWrite || this.userRole > UserRole.PARTICIPANT)
    );
  }

  startIntroduction() {
    const type: ComponentType<any> = this.brainstormingActive
      ? IntroductionBrainstormingComponent
      : IntroductionTagCloudComponent;
    this.dialog.open(type, {
      autoFocus: false,
    });
  }

  writeComment() {
    if (!this.canWriteComment(true)) {
      return;
    }
    this.createCommentWrapper
      .openCreateDialog(
        this.user,
        this.userRole,
        this.brainstormingActive && this.brainstormingData,
      )
      .subscribe();
  }

  rebuildBrainstormingData() {
    if (!this.cloud || !this.brainDataManager.currentData) {
      return;
    }
    const newElements = [];
    const data = this.brainDataManager.currentData;
    for (const [word, topic] of data) {
      this.createBrainTagElement(
        topic,
        word.id,
        word.correctedWord || word.word,
        newElements,
      );
    }
    this.data = newElements;
    setTimeout(() => {
      this.updateTagCloud(true);
    }, 2);
  }

  rebuildData() {
    if (!this.cloud || !this.dataManager.currentData) {
      return;
    }
    const newElements = [];
    const data = this.dataManager.currentData;
    const countFiler = [];
    for (let i = 0; i < 10; i++) {
      countFiler.push(
        this._currentSettings.cloudWeightSettings[i].maxVisibleElements,
      );
    }
    for (const [tag, tagData] of data) {
      const amount = this.dataManager.demoActive
        ? 10 - tagData.adjustedWeight
        : 1;
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
    this._smartDebounce.call(() => this.redraw(dataUpdated));
  }

  request() {
    return (i: number) => this.cloud.requestEntry(i);
  }

  openTags(tag: WordMeta, isRequested = false): void {
    if (this.dataManager.demoActive) {
      return;
    }
    //Room filter
    const filter = RoomDataFilter.loadFilter('commentList');
    filter.resetToDefault();
    filter.lastRoomId = this.room.id;
    filter.period = Period.All;
    if (this.brainstormingActive) {
      if (!isRequested) {
        return;
      }
      filter.sourceFilterBrainstorming = BrainstormingFilter.OnlyBrainstorming;
      filter.filterType = FilterType.BrainstormingIdea;
      filter.filterCompare = (tag as BrainstormComment).wordId;
    } else {
      filter.filterType = FilterType.Keyword;
      filter.filterCompare = (tag as TagComment).realText;
    }
    filter.save();
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  isCloudEmpty() {
    return !this.data?.length;
  }

  enter(word: ActiveWord<TagComment | BrainstormComment>) {
    const hoverDelay =
      (this._currentSettings.hoverTime + this._currentSettings.hoverDelay) *
      1_000;
    if (this.brainstormingActive) {
      this.sessionService.getCategoriesOnce().subscribe((categories) => {
        this.popup.enterBrainstorming(
          word.element,
          (word.meta as BrainstormComment).realText,
          this.brainstormingData?.active,
          this.brainstormingData?.ratingAllowed ||
            this.userRole > UserRole.PARTICIPANT,
          hoverDelay,
          (word.meta as BrainstormComment).brainData,
          (word.meta as BrainstormComment).wordId,
          categories,
        );
      });
      return;
    }
    this.popup.enter(
      word.element,
      word.meta.text,
      (word.meta as TagComment).tagData,
      hoverDelay,
      Boolean(this.room?.blacklistActive),
    );
  }

  leave() {
    this.popup.leave();
  }

  private init() {
    this.brainstormingActive = false;
    this._currentSettings = this.getCurrentCloudParameters();
    this.dataManager.getData().subscribe((data) => {
      if (!data) {
        return;
      }
      this.rebuildData();
    });
    this.userManagementService.getUser().subscribe((newUser) => {
      if (newUser) {
        this.user = newUser;
      }
    });
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
      this.createCommentWrapper = new CreateCommentWrapper(
        this.translateService,
        this.notificationService,
        this.commentService,
        this.dialog,
        this.room,
      );
      const raw = sessionStorage.getItem('tagCloudOnlyQuestions') !== 'true';
      const filterObj = FilteredDataAccess.buildNormalAccess(
        this.sessionService,
        this.roomDataService,
        raw,
        'tagCloud',
      );
      filterObj.attach({
        moderatorIds: new Set<string>(mods.map((m) => m.accountId)),
        threshold: room.threshold,
        ownerId: room.ownerId,
        roomId: room.id,
        userId: this.user.id,
      });
      this.dataManager.filterObject = filterObj;
    });
    this.themeSubscription = this.themeService.getTheme().subscribe((_) => {
      if (this.cloud) {
        setTimeout(() => {
          this.setCloudParameters(this.getCurrentCloudParameters(), false);
        }, 1);
      }
    });
  }

  private initBrainstorming() {
    this.brainstormingActive = true;
    this._currentSettings = this.getCurrentCloudParameters();
    this.brainDataManager.getData().subscribe((data) => {
      if (!data) {
        return;
      }
      this.rebuildBrainstormingData();
    });
    this.userManagementService.getUser().subscribe((newUser) => {
      if (newUser) {
        this.user = newUser;
      }
    });
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
      this.createCommentWrapper = new CreateCommentWrapper(
        this.translateService,
        this.notificationService,
        this.commentService,
        this.dialog,
        this.room,
      );
      const filterObj = FilteredDataAccess.buildNormalAccess(
        this.sessionService,
        this.roomDataService,
        true,
        'brainstorming',
      );
      filterObj.attach({
        moderatorIds: new Set<string>(mods.map((m) => m.accountId)),
        threshold: room.threshold,
        ownerId: room.ownerId,
        roomId: room.id,
        userId: this.user.id,
      });
      const filter = filterObj.dataFilter;
      filter.resetToDefault();
      filter.timeFilterStart = new Date(
        room.brainstormingSession.createdAt,
      ).getTime();
      filter.save();
      filterObj.dataFilter = filter;
      this.brainDataManager.filterObject = filterObj;
    });
    this.themeSubscription = this.themeService.getTheme().subscribe((_) => {
      if (this.cloud) {
        setTimeout(() => {
          this.setCloudParameters(this.getCurrentCloudParameters(), false);
        }, 1);
      }
    });
  }

  private createTagElement(
    countFiler: number[],
    tagData: TagCloudDataTagEntry,
    tag: string,
    newElements: TagComment[],
  ) {
    const remaining = countFiler[tagData.adjustedWeight];
    if (remaining !== 0) {
      if (remaining > 0) {
        --countFiler[tagData.adjustedWeight];
      }
      let rotation =
        this._currentSettings.cloudWeightSettings[tagData.adjustedWeight]
          .rotation;
      if (rotation === null || this._currentSettings.randomAngles) {
        rotation = Math.floor(Math.random() * 30 - 15);
      }
      const filteredTag = maskKeyword(tag);
      newElements.push(
        new TagComment(
          filteredTag,
          tag,
          rotation,
          tagData.weight,
          tagData,
          newElements.length,
        ),
      );
    }
  }

  private createBrainTagElement(
    topicData: BrainstormingTopic,
    wordId: string,
    tag: string,
    newElements: BrainstormComment[],
  ) {
    let rotation =
      this._currentSettings.cloudWeightSettings[topicData.adjustedWeight]
        .rotation;
    if (rotation === null || this._currentSettings.randomAngles) {
      rotation = Math.floor(Math.random() * 30 - 15);
    }
    let filteredTag = tag;
    if (filteredTag.length > this.brainstormingData.maxWordLength) {
      filteredTag =
        filteredTag.substring(0, this.brainstormingData.maxWordLength - 1) +
        '…';
    }
    newElements.push(
      new BrainstormComment(
        filteredTag,
        tag,
        rotation,
        topicData.weight,
        topicData,
        newElements.length,
        wordId,
      ),
    );
  }

  private getCurrentCloudParameters(): CloudParameters {
    return CloudParameters.getCurrentParameters(
      this.themeService.currentTheme.isDark,
    );
  }

  private retrieveTagCloudSettings(room: Room) {
    const settings = TagCloudSettings.getFromRoom(room);
    if (
      this.brainstormingActive &&
      (!room.brainstormingSession ||
        (this.brainstormingData &&
          this.brainstormingData.active !== room.brainstormingSession.active))
    ) {
      this.router.navigate(['../'], {
        relativeTo: this.route,
      });
      return;
    }
    clearInterval(this.intervalWriteChecker);
    this.brainstormingData = room.brainstormingSession;
    if (this.brainstormingData?.ideasEndTimestamp) {
      const isBefore = () =>
        this.brainstormingData.ideasEndTimestamp.getTime() >= Date.now();
      if (isBefore()) {
        this.intervalWriteChecker = setInterval(() => {
          if (!isBefore()) {
            clearInterval(this.intervalWriteChecker);
            this.writeComment();
            this.translateService
              .get('tag-cloud.write-last-idea')
              .subscribe((msg) => this.notificationService.show(msg));
          }
        }, 1_000);
      }
    }
    if (settings) {
      this.topicCloudAdmin.setAdminData(
        settings.adminData,
        null,
        this.userRole,
      );
      return;
    }
    if (this.userRole > UserRole.PARTICIPANT) {
      const tagCloudSettings = TagCloudSettings.getCurrent().serialize();
      this.roomService.patchRoom(this.room.id, { tagCloudSettings }).subscribe({
        next: () => {
          this.translateService
            .get('tag-cloud.changes-successful')
            .subscribe((msg) => {
              this.notificationService.show(msg);
            });
        },
        error: () => {
          this.translateService
            .get('tag-cloud.changes-gone-wrong')
            .subscribe((msg) => {
              this.notificationService.show(msg);
            });
        },
      });
    }
  }

  private initNavigation() {
    if (this.brainstormingActive) {
      this.sessionService.getRoomOnce().subscribe((room) => {
        this.brainstormingData = room.brainstormingSession;
        this.initBrainstormingNavigation();
      });
    } else {
      this.initNormalNavigation();
    }
  }

  private initNormalNavigation() {
    const list: ComponentRef<any>[] = this.composeService.builder(
      this.headerService.getHost(),
      (e) => {
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'forum',
          class: 'material-icons-outlined',
          text: 'header.back-to-questionboard',
          callback: () =>
            this.router.navigate(['../'], { relativeTo: this.route }),
          condition: () => true,
        });
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'format_paint',
          class: 'material-icons-filled',
          text: 'header.tag-cloud-config',
          callback: () => this.drawer.toggle(),
          condition: () => true,
        });
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'handyman',
          class: 'material-icons-outlined',
          text: 'header.tag-cloud-administration',
          callback: () =>
            this.dialog.open(TopicCloudAdministrationComponent, {
              minWidth: '50%',
              maxHeight: '95%',
              data: {
                userRole: this.userRole,
              },
            }),
          condition: () => this.userRole > UserRole.PARTICIPANT,
        });
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'auto_fix_high',
          class: 'material-icons-outlined',
          text: 'header.update-spacy-keywords',
          callback: () =>
            WorkerConfigDialogComponent.addTask(this.dialog, this.room),
          condition: () => this.userRole > UserRole.PARTICIPANT,
        });
      },
    );
    this.onDestroyListener.subscribe(() => {
      list.forEach((e) => e.destroy());
    });
  }

  private initBrainstormingNavigation() {
    const list: ComponentRef<any>[] = this.composeService.builder(
      this.headerService.getHost(),
      (e) => {
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'forum',
          class: 'material-icons-outlined',
          text: 'header.brainstorm-back-to-questionboard',
          callback: () =>
            this.router.navigate(['../'], { relativeTo: this.route }),
          condition: () => true,
        });
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'question_mark',
          class: 'material-icons-outlined',
          text: 'header.brainstorm-info',
          callback: () => {
            this.dialog.open(IntroductionBrainstormingComponent, {
              autoFocus: false,
            });
          },
          condition: () => this.userRole > UserRole.PARTICIPANT,
        });
        e.altToggle(
          {
            translate: this.headerService.getTranslate(),
            icon: 'timer',
            class: 'material-icons-outlined',
            text: 'header.brainstorm-start',
          },
          {
            translate: this.headerService.getTranslate(),
            icon: 'timer_off',
            class: 'material-icons-outlined',
            text: 'header.brainstorm-stop',
          },
          ArsObserver.build<boolean>((emitter) => {
            emitter.set(this.brainstormingData.ideasEndTimestamp !== null);
            emitter.onChange((observer) => {
              this.brainstormingService
                .patchSession(this.brainstormingData.id, {
                  ideasEndTimestamp: observer.get()
                    ? ((Date.now() +
                        this.brainstormingData.ideasTimeDuration *
                          60_000) as unknown as Date)
                    : null,
                  ideasFrozen: !observer.get(),
                })
                .subscribe();
            });
          }),
          () =>
            this.userRole > UserRole.PARTICIPANT &&
            this.brainstormingData.active,
        );
        e.altToggle(
          {
            translate: this.headerService.getTranslate(),
            icon: 'lightbulb_circle',
            class: 'material-icons-outlined',
            text: 'header.brainstorm-freeze-ideas',
          },
          {
            translate: this.headerService.getTranslate(),
            icon: 'lightbulb_circle',
            class: 'material-icons',
            text: 'header.brainstorm-unfreeze-ideas',
          },
          ArsObserver.build<boolean>((emitter) => {
            emitter.set(this.brainstormingData.ideasFrozen ?? true);
            emitter.onChange((observer) => {
              this.brainstormingService
                .patchSession(this.brainstormingData.id, {
                  ideasFrozen: observer.get(),
                })
                .subscribe();
            });
          }),
          () =>
            this.userRole > UserRole.PARTICIPANT &&
            this.brainstormingData.ideasEndTimestamp === null &&
            this.brainstormingData.active,
        );
        e.menuItem({
          translate: this.headerService.getTranslate(),
          isSVGIcon: true,
          icon: 'beamer',
          class: 'material-icons-outlined',
          text: 'header.brainstorm-question-focus',
          callback: () => {
            const filter = RoomDataFilter.loadFilter('presentation');
            filter.resetToDefault();
            filter.sourceFilterBrainstorming =
              BrainstormingFilter.OnlyBrainstorming;
            filter.lastRoomId = this.room.id;
            filter.save();
            this.router.navigate([
              '/participant/room/' +
                this.room.shortId +
                '/comments/questionwall',
            ]);
          },
          condition: () => this.userRole > UserRole.PARTICIPANT,
        });
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'batch_prediction',
          class: 'material-icons-outlined',
          text: 'header.brainstorm-q-and-a',
          callback: () => {
            const filter = RoomDataFilter.loadFilter('commentList');
            filter.resetToDefault();
            filter.sourceFilterBrainstorming =
              BrainstormingFilter.OnlyBrainstorming;
            filter.lastRoomId = this.room.id;
            filter.save();
            this.router.navigate(['../'], { relativeTo: this.route });
          },
          condition: () => true,
        });
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'interests',
          class: 'material-icons-filled',
          text: 'header.brainstorm-categories',
          callback: () => {
            this.sessionService.getCategoriesOnce().subscribe((categories) => {
              const dialogRef = this.dialog.open(
                BrainstormingCategoryEditorComponent,
                {
                  width: '400px',
                },
              );
              dialogRef.componentInstance.tags = categories.map((c) => c.name);
              dialogRef.afterClosed().subscribe((result) => {
                if (!result || result === 'abort') {
                  return;
                }
                this.brainstormingService
                  .updateCategories(this.sessionService.currentRoom.id, result)
                  .subscribe({
                    next: () => {
                      this.translateService
                        .get('room-page.changes-successful')
                        .subscribe((msg) => {
                          this.notificationService.show(msg);
                        });
                    },
                    error: () => {
                      this.translateService
                        .get('room-page.changes-gone-wrong')
                        .subscribe((msg) => {
                          this.notificationService.show(msg);
                        });
                    },
                  });
              });
            });
          },
          condition: () => this.userRole > UserRole.PARTICIPANT,
        });
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'model_training',
          class: 'material-icons-outlined',
          text: 'header.brainstorm-reset-rating',
          callback: () => {
            const dialogRef = this.dialog.open(
              BrainstormingDeleteConfirmComponent,
              {
                autoFocus: true,
              },
            );
            dialogRef.componentInstance.type = 'rating';
            dialogRef.componentInstance.sessionId = this.brainstormingData.id;
          },
          condition: () => this.userRole > UserRole.PARTICIPANT,
        });
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'restart_alt',
          class: 'material-icons-outlined',
          text: 'header.brainstorm-reset-categorization',
          callback: () => {
            const dialogRef = this.dialog.open(
              BrainstormingDeleteConfirmComponent,
              {
                autoFocus: true,
              },
            );
            dialogRef.componentInstance.type = 'category';
            dialogRef.componentInstance.sessionId = this.brainstormingData.id;
          },
          condition: () => this.userRole > UserRole.PARTICIPANT,
        });
        e.altToggle(
          {
            translate: this.headerService.getTranslate(),
            icon: 'lock_open',
            class: 'material-icons',
            text: 'header.brainstorm-unfreeze-session',
          },
          {
            translate: this.headerService.getTranslate(),
            icon: 'lock_clock',
            class: 'material-icons-outlined',
            text: 'header.brainstorm-freeze-session',
          },
          ArsObserver.build<boolean>((emitter) => {
            emitter.set(this.brainstormingData.active ?? true);
            emitter.onChange((observer) => {
              const update: Partial<BrainstormingSession> = {};
              if (observer.get()) {
                update.active = true;
              } else {
                update.active = false;
                update.ideasEndTimestamp = null;
                update.ideasFrozen = true;
                update.ratingAllowed = false;
              }
              this.brainstormingService
                .patchSession(this.brainstormingData.id, update)
                .subscribe();
            });
          }),
          () => this.userRole > UserRole.PARTICIPANT,
        );
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'summarize',
          class: 'material-icons-outlined',
          text: 'header.brainstorm-blacklist',
          callback: () => {
            const ref = this.dialog.open(BrainstormingBlacklistEditComponent, {
              minWidth: '50%',
              maxHeight: '95%',
              data: {
                userRole: this.userRole,
              },
            });
            ref.componentInstance.room = this.room;
          },
          condition: () => this.userRole > UserRole.PARTICIPANT,
        });
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'psychology',
          class: 'material-icons-filled',
          text: 'header.brainstorm-settings',
          callback: () => {
            const dialogRef = this.dialog.open(BrainstormingEditComponent, {
              autoFocus: true,
            });
            dialogRef.componentInstance.session = this.brainstormingData;
            dialogRef.componentInstance.userRole = this.userRole;
          },
          condition: () => this.userRole > UserRole.PARTICIPANT,
        });
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'format_paint',
          class: 'material-icons-filled',
          text: 'header.brainstorm-look-and-feel',
          callback: () => this.drawer.toggle(),
          condition: () => true,
        });
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'file_download',
          class: 'material-icons-outlined',
          text: 'header.brainstorm-export',
          callback: () => {
            this.sessionService
              .getModeratorsOnce()
              .pipe(
                switchMap((mods) =>
                  exportBrainstorming(
                    this.translateService,
                    this.notificationService,
                    this.bonusTokenService,
                    this.commentService,
                    'room-export',
                    this.user,
                    this.room,
                    new Set(mods.map((m) => m.accountId)),
                  ),
                ),
              )
              .subscribe((text) => {
                copyCSVString(
                  text[0],
                  'brainstorming-' +
                    this.room.name +
                    '-' +
                    this.room.shortId +
                    '-' +
                    text[1] +
                    '.csv',
                );
              });
          },
          condition: () => true,
        });
      },
    );
    this.onDestroyListener.subscribe(() => {
      list.forEach((e) => e.destroy());
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
    const dataUpdates = [
      'randomAngles',
      'sortAlphabetically',
      'fontSizeMin',
      'fontSizeMax',
      'textTransform',
      'fontStyle',
      'fontWeight',
      'fontFamily',
      'fontSize',
    ];
    const dataWeightUpdates = ['maxVisibleElements', 'rotation'];
    for (const key of dataUpdates) {
      if (this._currentSettings[key] !== parameters[key]) {
        return 2;
      }
    }
    for (let i = 0; i < 10; i++) {
      for (const key of dataWeightUpdates) {
        if (
          this._currentSettings.cloudWeightSettings[i][key] !==
          parameters.cloudWeightSettings[i][key]
        ) {
          return 2;
        }
      }
    }
    return 0;
  }
}
