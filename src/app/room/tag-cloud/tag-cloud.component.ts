import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import {
  AfterContentInit,
  Component,
  EventEmitter,
  Injector,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import { CloudOptions, ZoomOnHoverOptions } from 'angular-tag-cloud-module';
import { CommentService } from '../../services/http/comment.service';
import { TranslateService } from '@ngx-translate/core';
import { User } from '../../models/user';
import { Room } from '../../models/room';
import { NotificationService } from '../../services/util/notification.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UserRole } from '../../models/user-roles.enum';
import { RoomService } from '../../services/http/room.service';
import { TopicCloudAdminService } from '../../services/util/topic-cloud-admin.service';
import { TagCloudPopUpComponent } from './tag-cloud-pop-up/tag-cloud-pop-up.component';
import {
  TagCloudDataService,
  TagCloudDataTagEntry,
} from '../../services/util/tag-cloud-data.service';
import { CloudParameters } from '../../utils/cloud-parameters';
import { SmartDebounce } from '../../utils/smart-debounce';
import { MatDrawer } from '@angular/material/sidenav';
import {
  ActiveWord,
  WordCloudComponent,
  WordMeta,
} from './word-cloud/word-cloud.component';
import { TagCloudSettings } from '../../utils/TagCloudSettings';
import { SessionService } from '../../services/util/session.service';
import { BrainstormingSession } from '../../models/brainstorming-session';
import { IntroductionTagCloudComponent } from '../../components/shared/_dialogs/introductions/introduction-tag-cloud/introduction-tag-cloud.component';
import { IntroductionBrainstormingComponent } from '../../components/shared/_dialogs/introductions/introduction-brainstorming/introduction-brainstorming.component';
import { ComponentType } from '@angular/cdk/overlay';
import {
  BrainstormingFilter,
  FilterType,
  Period,
  RoomDataFilter,
} from '../../utils/data-filter-object.lib';
import { maskKeyword } from '../../services/util/tag-cloud-data.util';
import { FilteredDataAccess } from '../../utils/filtered-data-access';
import { filter, first, forkJoin, Subject, switchMap, takeUntil } from 'rxjs';
import { BrainstormingTopic } from 'app/services/util/brainstorming-data-builder';
import { BrainstormingDataService } from 'app/services/util/brainstorming-data.service';
import { TimeoutHelper } from 'app/utils/ts-utils';
import { BrainstormingCategory } from 'app/models/brainstorming-category';
import { EventService } from 'app/services/util/event.service';
import { ChatGPTBrainstormComponent } from '../../components/shared/_dialogs/chat-gptbrainstorm/chat-gptbrainstorm.component';
import {
  ROOM_ROLE_MAPPER,
  RoomStateService,
} from 'app/services/state/room-state.service';
import { MatDialog } from '@angular/material/dialog';
import { applyRadarNavigation } from './navigation/word-cloud-navigation';
import { applyBrainstormingNavigation } from './navigation/brainstorming-navigation';
import { user$ } from 'app/user/state/user';
import { isDark, theme } from 'app/base/theme/theme';
import {
  generateComment,
  writeInteractiveComment,
} from '../comment/util/create-comment';
import { Comment } from 'app/models/comment';
import { windowWatcher } from 'modules/navigation/utils/window-watcher';
import { M3WindowSizeClass } from 'modules/m3/components/navigation/m3-navigation-types';
import { FAB_BUTTON } from 'modules/navigation/m3-navigation-emitter';

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
  ) {}
}

@Component({
  selector: 'app-tag-cloud',
  templateUrl: './tag-cloud.component.html',
  styleUrls: ['./tag-cloud.component.scss'],
  standalone: false,
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
  protected data = signal<(TagComment | BrainstormComment)[]>([]);
  isLoading = true;
  brainstormingData: BrainstormingSession;
  brainstormingActive: boolean;
  brainstormingCategories: BrainstormingCategory[];
  protected starting = signal(true);
  protected classes = computed(() => {
    if (this.isCloudEmpty()) return '';
    return windowWatcher.windowState() === M3WindowSizeClass.Compact
      ? 'mobile'
      : 'desktop';
  });
  protected isNotInSidebar = computed(() => {
    return this.starting() || this.classes() !== 'desktop';
  });
  private destroyer = new Subject();
  private _currentSettings: CloudParameters;
  private _subscriptionRoom = null;
  private readonly _smartDebounce = new SmartDebounce(50, 1_000);
  private intervalWriteChecker: TimeoutHelper;
  private demoDataKeys: [string, TagCloudDataTagEntry][] = [];
  private _demoActive = false;
  private injector = inject(Injector);
  private _e1 = effect((cleanup) => {
    const inSidebar = !this.isNotInSidebar();
    if (inSidebar && this.brainstormingActive && this.canWriteComment()) {
      FAB_BUTTON.set({
        icon: 'add',
        title: i18n().addIdea,
        onClick: () => {
          this.writeComment();
          return false;
        },
      });
    }
    cleanup(() => {
      FAB_BUTTON.set(null);
    });
  });

  constructor(
    private commentService: CommentService,
    private translateService: TranslateService,
    public dialog: MatDialog,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    protected roomService: RoomService,
    private topicCloudAdmin: TopicCloudAdminService,
    private sessionService: SessionService,
    private router: Router,
    public dataManager: TagCloudDataService,
    public brainDataManager: BrainstormingDataService,
    private eventService: EventService,
    private roomState: RoomStateService,
  ) {
    let url = this.router.url;
    if (url.includes('#')) {
      url = url.substring(0, url.indexOf('#'));
    }
    this.brainstormingActive = url.endsWith('/brainstorming');
    this.initNavigation();
    for (let i = 0; i < 10; i++) {
      this.demoDataKeys.push([
        '',
        {
          weight: i,
          adjustedWeight: i,
          answerCount: 0,
          cachedDownVotes: 0,
          cachedUpVotes: 0,
          cachedVoteCount: 0,
          categories: new Set(),
          comments: [],
          commentsByCreator: 0,
          commentsByModerators: 0,
          countedComments: new Set(),
          dependencies: new Set(),
          distinctUsers: new Set(),
          firstTimeStamp: new Date(),
          generatedByQuestionerCount: 0,
          lastTimeStamp: new Date(),
          questionChildren: new Map(),
          responseCount: 0,
          taggedCommentsCount: 0,
        },
      ]);
    }
  }

  get tagCloudDataManager(): TagCloudDataService {
    return this.dataManager;
  }

  get currentCloudParameters(): CloudParameters {
    return new CloudParameters(this._currentSettings);
  }

  get demoActive(): boolean {
    return this._demoActive;
  }

  set demoActive(value: boolean) {
    if (value === this._demoActive) {
      return;
    }
    this._demoActive = value;
    this.rebuildDemoData();
  }

  ngOnInit(): void {
    this.sessionService.onReady.subscribe(() => {
      this.route.data.subscribe((d) => {
        this.brainstormingActive = Boolean(d['brainstorming']);
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
      this.translateService
        .get('tag-cloud.demo-data-topic')
        .subscribe((text) => {
          for (let i = 0; i < 10; i++) {
            this.demoDataKeys[i][0] = text.replace('%d', String(i + 1));
          }
        });
      this.setCloudParameters(this.getCurrentCloudParameters(), false);
    });
  }

  ngOnDestroy() {
    this.destroyer.next(true);
    this.destroyer.complete();
    this.dataManager.unloadCloud();
    const customTagCloudStyles = document.getElementById(
      'tagCloudStyles',
    ) as HTMLStyleElement;
    if (customTagCloudStyles) {
      customTagCloudStyles.sheet.disabled = true;
    }
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
    param.resetToDefault(isDark());
    this.setCloudParameters(param, false);
    CloudParameters.removeParameters();
  }

  onResize() {
    this.updateTagCloud();
  }

  setIdeaFiltering(value: string | null) {
    this.brainDataManager.ideaFiltering = value;
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
    const type: ComponentType<unknown> = this.brainstormingActive
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
    writeInteractiveComment(
      this.injector,
      this.brainstormingActive && this.brainstormingData,
    ).subscribe();
  }

  rebuildBrainstormingData() {
    if (this.demoActive) {
      this.rebuildDemoData();
      return;
    }
    if (!this.cloud || !this.brainDataManager.currentData) {
      return;
    }
    const newElements = [];
    const data = this.brainDataManager.currentData;
    for (const topic of data) {
      this.createBrainTagElement(topic, newElements);
    }
    this.data.set(newElements);
    setTimeout(() => {
      this.updateTagCloud(true);
    }, 2);
  }

  rebuildData() {
    if (this.demoActive) {
      this.rebuildDemoData();
      return;
    }
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
      this.createTagElement(countFiler, tagData, tag, newElements);
    }
    this.data.set(newElements);
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
    if (this.demoActive) {
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
      filter.filterCompare = [...(tag as BrainstormComment).brainData.words];
    } else {
      filter.filterType = FilterType.Keyword;
      filter.filterCompare = (tag as TagComment).realText;
    }
    filter.save();
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  isCloudEmpty() {
    return !this.data()?.length;
  }

  enter(word: ActiveWord<TagComment | BrainstormComment>) {
    const hoverDelay =
      (this._currentSettings.hoverTime + this._currentSettings.hoverDelay) *
      1_000;
    if (this.brainstormingActive) {
      this.popup.enterBrainstorming(
        word.element,
        (word.meta as BrainstormComment).realText,
        this.brainstormingData?.active,
        this.brainstormingData?.ratingAllowed ||
          this.userRole > UserRole.PARTICIPANT,
        hoverDelay,
        (word.meta as BrainstormComment).brainData,
        this.brainstormingCategories,
      );
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
    user$.pipe(takeUntil(this.destroyer)).subscribe((newUser) => {
      if (newUser) {
        this.user = newUser;
      }
    });
    forkJoin([
      this.sessionService.getRoomOnce(),
      this.sessionService.getModeratorsOnce(),
      user$.pipe(first(Boolean)),
    ]).subscribe(([room, mods, user]) => {
      this.userRole = ROOM_ROLE_MAPPER[this.roomState.getCurrentAssignedRole()];
      this.shortId = room.shortId;
      this.roomId = room.id;
      this.room = room;
      this.sessionService.receiveRoomUpdates().subscribe(() => {
        this.retrieveTagCloudSettings(room);
      });
      this.retrieveTagCloudSettings(room);
      this.directSend = this.room.directSend;
      const raw = sessionStorage.getItem('tagCloudOnlyQuestions') !== 'true';
      const filterObj = FilteredDataAccess.buildNormalAccess(
        this.sessionService,
        this.injector,
        raw,
        'tagCloud',
      );
      filterObj.attach({
        moderatorIds: new Set<string>(mods.map((m) => m.accountId)),
        threshold: room.threshold,
        ownerId: room.ownerId,
        roomId: room.id,
        userId: user.id,
      });
      this.dataManager.filterObject = filterObj;
    });
    effect(
      () => {
        theme();
        if (this.cloud) {
          setTimeout(() => {
            this.setCloudParameters(this.getCurrentCloudParameters(), false);
          }, 1);
        }
      },
      { injector: this.injector },
    );
  }

  private rebuildDemoData() {
    if (!this.cloud) {
      return;
    }
    const newElements = [];
    const countFiler = [];
    for (let i = 0; i < 10; i++) {
      countFiler.push(
        this._currentSettings.cloudWeightSettings[i].maxVisibleElements,
      );
    }
    for (let i = 0; i < this.demoDataKeys.length; i++) {
      const amount = 10 - i;
      for (let i = 0; i < amount; i++) {
        const [tag, tagData] = this.demoDataKeys[i];
        this.createTagElement(countFiler, tagData, tag, newElements);
      }
    }
    this.data.set(newElements);
    setTimeout(() => {
      this.updateTagCloud(true);
    }, 2);
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
    user$.pipe(takeUntil(this.destroyer)).subscribe((newUser) => {
      if (newUser) {
        this.user = newUser;
      }
    });
    this.eventService
      .on('tag-cloud.brainstorming-ideas-with-chatgpt')
      .subscribe(() => {
        const ref = ChatGPTBrainstormComponent.open(this.dialog, this.room);
        ref.afterClosed().subscribe((e) => {
          if (!e) {
            return;
          }
          const session = this.room.brainstormingSession;
          e.forEach((elem) => {
            generateComment({
              body: elem,
              pureText: elem,
              brainstormingSession: session,
              questionerName: 'AI',
              selectedLanguage: 'AUTO' as Comment['language'],
              injector: this.injector,
              tag: null,
              commentReference: null,
            })
              .pipe(
                filter((c) => Boolean(c)),
                switchMap((c) => this.commentService.addComment(c)),
              )
              .subscribe();
          });
        });
      });
    this.sessionService
      .getCategories()
      .pipe(takeUntil(this.destroyer))
      .subscribe((categories) => {
        this.brainstormingCategories = categories || [];
        this.brainstormingCategories.sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
        );
      });
    forkJoin([
      this.sessionService.getRoomOnce(),
      this.sessionService.getModeratorsOnce(),
      user$.pipe(first(Boolean)),
    ]).subscribe(([room, mods, user]) => {
      this.userRole = ROOM_ROLE_MAPPER[this.roomState.getCurrentAssignedRole()];
      this.shortId = room.shortId;
      this.roomId = room.id;
      this.room = room;
      this.sessionService.receiveRoomUpdates().subscribe(() => {
        this.retrieveTagCloudSettings(room);
      });
      this.retrieveTagCloudSettings(room);
      this.directSend = this.room.directSend;
      const filterObj = FilteredDataAccess.buildNormalAccess(
        this.sessionService,
        this.injector,
        true,
        'brainstorming',
      );
      filterObj.attach({
        moderatorIds: new Set<string>(mods.map((m) => m.accountId)),
        threshold: room.threshold,
        ownerId: room.ownerId,
        roomId: room.id,
        userId: user.id,
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
    effect(
      () => {
        theme();
        if (this.cloud) {
          setTimeout(() => {
            this.setCloudParameters(this.getCurrentCloudParameters(), false);
          }, 1);
        }
      },
      { injector: this.injector },
    );
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
    newElements: BrainstormComment[],
  ) {
    let rotation =
      this._currentSettings.cloudWeightSettings[topicData.adjustedWeight]
        .rotation;
    if (rotation === null || this._currentSettings.randomAngles) {
      rotation = Math.floor(Math.random() * 30 - 15);
    }
    let filteredTag = topicData.preview;
    if (filteredTag.length > this.brainstormingData.maxWordLength) {
      filteredTag =
        filteredTag.substring(0, this.brainstormingData.maxWordLength - 1) +
        '…';
    }
    newElements.push(
      new BrainstormComment(
        filteredTag,
        topicData.preview,
        rotation,
        topicData.weight,
        topicData,
        newElements.length,
      ),
    );
  }

  private getCurrentCloudParameters(): CloudParameters {
    return CloudParameters.getCurrentParameters(isDark());
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
              .subscribe((msg) =>
                this.notificationService.show(msg, undefined, {
                  duration: 12_500,
                  panelClass: ['snackbar', 'important'],
                }),
              );
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
      applyBrainstormingNavigation(this.injector, () => {
        this.drawer.toggle();
        return true;
      })
        .pipe(takeUntil(this.destroyer))
        .subscribe();
      this.sessionService.getRoomOnce().subscribe((room) => {
        this.brainstormingData = room.brainstormingSession;
      });
    } else {
      applyRadarNavigation(this.injector, () => {
        this.drawer.toggle();
        return true;
      })
        .pipe(takeUntil(this.destroyer))
        .subscribe();
    }
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
