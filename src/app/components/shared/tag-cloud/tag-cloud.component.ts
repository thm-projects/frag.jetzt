import { AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';

import {
  CloudData,
  CloudOptions,
  Position,
  TagCloudComponent as TCloudComponent,
  ZoomOnHoverOptions
} from 'angular-tag-cloud-module';
import { CommentService } from '../../../services/http/comment.service';
import { SpacyService } from '../../../services/http/spacy.service';
import { Comment } from '../../../models/comment';
import { LanguageService } from '../../../services/util/language.service';
import { TranslateService } from '@ngx-translate/core';
import { CreateCommentComponent } from '../_dialogs/create-comment/create-comment.component';
import { MatDialog } from '@angular/material/dialog';
import { User } from '../../../models/user';
import { Room } from '../../../models/room';
import { NotificationService } from '../../../services/util/notification.service';
import { EventService } from '../../../services/util/event.service';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { ActivatedRoute } from '@angular/router';
import { UserRole } from '../../../models/user-roles.enum';
import { RoomService } from '../../../services/http/room.service';
import { ThemeService } from '../../../../theme/theme.service';
import { cloneParameters, CloudParameters, CloudTextStyle, CloudWeightSettings } from './tag-cloud.interface';
import { TopicCloudAdministrationComponent } from '../_dialogs/topic-cloud-administration/topic-cloud-administration.component';
import { WsCommentServiceService } from '../../../services/websockets/ws-comment-service.service';
import { TagCloudDataManager } from './tag-cloud.data-manager';

class CustomPosition implements Position {
  left: number;
  top: number;

  constructor(public relativeLeft: number,
              public relativeTop: number) {
  }

  updatePosition(width: number, height: number, text: string, style: CSSStyleDeclaration) {
    const offsetY = parseFloat(style.height) / 2;
    const offsetX = parseFloat(style.width) / 2;
    this.left = width * this.relativeLeft - offsetX;
    this.top = height * this.relativeTop - offsetY;
  }
}

class TagComment implements CloudData {
  constructor(public color: string,
              public external: boolean,
              public link: string,
              public position: Position,
              public rotate: number,
              public text: string,
              public tooltip: string,
              public weight: number) {
  }
}

const colorRegex = /rgba?\((\d+), (\d+), (\d+)(?:, (\d(?:\.\d+)?))?\)/;
const transformationScaleKiller = /scale\([^)]*\)/;
const defaultColors: string[] = [
  // variable, fallback
  'var(--secondary, greenyellow)', // hover
  'var(--moderator, lightblue)', // w1
  'var(--blue, green)', // w2
  'var(--grey, yellow)', // w3
  'var(--red, orange)', // w4
  'var(--primary, pink)', // w5
  'var(--yellow, gray)', // w6
  'var(--on-background, lightgreen)', // w7
  'var(--purple, tomato)', // w8
  'var(--magenta, white)', // w9
  'var(--light-green, brown)', // w10
  'var(--background, black)' //background
];

const getResolvedDefaultColors = (): string[] => {
  const elem = document.createElement('p');
  elem.style.display = 'none';
  document.body.appendChild(elem);
  const results = [];
  for (const color of defaultColors) {
    elem.style.backgroundColor = 'rgb(0, 0, 0)'; // fallback
    elem.style.backgroundColor = color;
    const result = window.getComputedStyle(elem).backgroundColor.match(colorRegex);
    const r = parseInt(result[1], 10);
    const g = parseInt(result[2], 10);
    const b = parseInt(result[3], 10);
    results.push(`#${((r * 256 + g) * 256 + b).toString(16).padStart(6, '0')}`);
  }
  elem.remove();
  return results;
};

const getDefaultCloudParameters = (): CloudParameters => {
  const resDefaultColors = getResolvedDefaultColors();
  const weightSettings: CloudWeightSettings = [
    {maxVisibleElements: -1, color: resDefaultColors[1], rotation: 0},
    {maxVisibleElements: -1, color: resDefaultColors[2], rotation: 0},
    {maxVisibleElements: -1, color: resDefaultColors[3], rotation: 0},
    {maxVisibleElements: -1, color: resDefaultColors[4], rotation: 0},
    {maxVisibleElements: -1, color: resDefaultColors[5], rotation: 0},
    {maxVisibleElements: -1, color: resDefaultColors[6], rotation: 0},
    {maxVisibleElements: -1, color: resDefaultColors[7], rotation: 0},
    {maxVisibleElements: -1, color: resDefaultColors[8], rotation: 0},
    {maxVisibleElements: -1, color: resDefaultColors[9], rotation: 0},
    {maxVisibleElements: -1, color: resDefaultColors[10], rotation: 0},
  ];
  return {
    backgroundColor: resDefaultColors[11],
    fontColor: resDefaultColors[0],
    fontSizeMin: 100,
    fontSizeMax: 380,
    hoverScale: 1.3,
    hoverTime: 0.6,
    hoverDelay: 0.4,
    delayWord: 0,
    randomAngles: false,
    checkSpelling: true,
    sortAlphabetically: true,
    textTransform: CloudTextStyle.lowercase,
    cloudWeightSettings: weightSettings
  };
};

@Component({
  selector: 'app-tag-cloud',
  templateUrl: './tag-cloud.component.html',
  styleUrls: ['./tag-cloud.component.scss']
})
export class TagCloudComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(TCloudComponent, {static: false}) child: TCloudComponent;
  @Input() user: User;
  @Input() roomId: string;
  room: Room;
  directSend = true;
  shortId: string;
  options: CloudOptions = {
    // if width is between 0 and 1 it will be set to the width of the upper element multiplied by the value
    width: 1,
    // if height is between 0 and 1 it will be set to the height of the upper element multiplied by the value
    height: 1,
    overflow: false,
    font: 'Georgia', // not working
    delay: 0
  };
  zoomOnHoverOptions: ZoomOnHoverOptions = {
    scale: 1.3, // Elements will become 130 % of current size on hover
    transitionTime: 0.6, // it will take 0.6 seconds until the zoom level defined in scale property has been reached
    delay: 0.4 // Zoom will take affect after 0.4 seconds
  };
  userRole: UserRole;
  data: TagComment[] = [];
  debounceTimer = 0;
  lastDebounceTime = 0;
  configurationOpen = false;
  isLoading = true;
  //Subscriptions
  headerInterface = null;
  themeSubscription = null;
  readonly dataManager: TagCloudDataManager;
  private _currentSettings: CloudParameters;

  constructor(private commentService: CommentService,
              private spacyService: SpacyService,
              private langService: LanguageService,
              private translateService: TranslateService,
              public dialog: MatDialog,
              private notificationService: NotificationService,
              public eventService: EventService,
              private authenticationService: AuthenticationService,
              private route: ActivatedRoute,
              protected roomService: RoomService,
              private themeService: ThemeService,
              private wsCommentService: WsCommentServiceService) {
    this.roomId = localStorage.getItem('roomId');
    this.langService.langEmitter.subscribe(lang => {
      this.translateService.use(lang);
    });
    this.dataManager = new TagCloudDataManager(wsCommentService, commentService);
    this._currentSettings = TagCloudComponent.getCurrentCloudParameters();
  }

  private static getCurrentCloudParameters(): CloudParameters {
    const jsonData = localStorage.getItem('tagCloudConfiguration');
    const temp: CloudParameters = jsonData != null ? JSON.parse(jsonData) : null;
    const elem = getDefaultCloudParameters();
    if (temp != null) {
      for (const key in Object.keys(elem)) {
        if (temp[key] !== undefined) {
          elem[key] = temp[key];
        }
      }
    }
    return elem;
  }

  ngOnInit(): void {
    this.updateGlobalStyles();
    this.headerInterface = this.eventService.on<string>('navigate').subscribe(e => {
      if (e === 'createQuestion') {
        this.openCreateDialog();
      } else if (e === 'topicCloudConfig') {
        this.configurationOpen = !this.configurationOpen;
        this.dataManager.demoActive = !this.dataManager.demoActive;
      } else if (e === 'topicCloudAdministration') {
        this.dialog.open(TopicCloudAdministrationComponent, {
          minWidth: '50%'
        });
      }
    });
    this.dataManager.getData().subscribe(_ => {
      this.rebuildData();
    });
    this.dataManager.getMetaData().subscribe(data => {
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
      this.authenticationService.guestLogin(UserRole.PARTICIPANT).subscribe(r => {
        this.roomService.getRoomByShortId(this.shortId).subscribe(room => {
          this.room = room;
          this.roomId = room.id;
          this.directSend = this.room.directSend;
          if (!this.authenticationService.hasAccess(this.shortId, UserRole.PARTICIPANT)) {
            this.roomService.addToHistory(this.room.id);
            this.authenticationService.setAccess(this.shortId, UserRole.PARTICIPANT);
          }
        });
      });
    });
    this.translateService.use(localStorage.getItem('currentLang'));
    this.themeSubscription = this.themeService.getTheme().subscribe(() => {
      if (this.child) {
        setTimeout(() => {
          this.setCloudParameters(TagCloudComponent.getCurrentCloudParameters(), false);
        }, 1);
      }
    });
  }

  ngAfterViewInit() {
    document.getElementById('footer_rescale').style.display = 'none';
  }

  ngOnDestroy() {
    document.getElementById('footer_rescale').style.display = 'block';
    this.headerInterface.unsubscribe();
    this.themeSubscription.unsubscribe();
    this.dataManager.deactivate();
  }

  initTagCloud() {
    this.dataManager.activate(this.roomId);
    this.dataManager.updateDemoData(this.translateService);
    this.setCloudParameters(TagCloudComponent.getCurrentCloudParameters(), false);
    setTimeout(() => {
      this.redraw();
    });
  }

  get tagCloudDataManager(): TagCloudDataManager {
    return this.dataManager;
  }

  get currentCloudParameters(): CloudParameters {
    return cloneParameters(this._currentSettings);
  }

  setCloudParameters(parameters: CloudParameters, save = true): void {
    parameters = cloneParameters(parameters);
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
      localStorage.setItem('tagCloudConfiguration', JSON.stringify(parameters));
    }
  }

  resetColorsToTheme() {
    this.setCloudParameters(getDefaultCloudParameters());
  }


  onResize(event: UIEvent): any {
    this.updateTagCloud();
  }

  rebuildData() {
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
          newElements.push(new TagComment(null, true, null, null, rotation, tag, 'TODO', tagData.weight));
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
    }
    this.data = newElements;
    setTimeout(() => {
      this.updateTagCloud(true);
    }, 2);
  }

  updateTagCloud(dataUpdated = false) {
    this.isLoading = true;
    if (this._currentSettings.sortAlphabetically && this.data.length) {
      if (dataUpdated || !this.child.cloudDataHtmlElements || !this.child.cloudDataHtmlElements.length) {
        this.child.reDraw();
      }
      const width = this.child.calculatedWidth;
      const height = this.child.calculatedHeight;
      this.data.forEach((e, i) => {
        (e.position as CustomPosition).updatePosition(width, height, e.text,
          window.getComputedStyle(this.child.cloudDataHtmlElements[i]));
      });
    }
    const debounceTime = 1_000;
    const current = new Date().getTime();
    const diff = current - this.lastDebounceTime;
    if (diff >= debounceTime) {
      this.redraw();
    } else {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.redraw();
      }, debounceTime - diff);
    }
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateCommentComponent, {
      width: '900px',
      maxWidth: 'calc( 100% - 50px )',
      maxHeight: 'calc( 100vh - 50px )',
      autoFocus: false,
    });
    dialogRef.componentInstance.user = this.user;
    dialogRef.componentInstance.roomId = this.roomId;
    let tags;
    tags = [];
    if (this.room.tags) {
      tags = this.room.tags;
    }
    dialogRef.componentInstance.tags = tags;
    dialogRef.afterClosed()
      .subscribe(result => {
        if (result) {
          this.send(result);
        } else {
          return;
        }
      });
  }

  send(comment: Comment): void {
    if (this.directSend) {
      this.translateService.get('comment-list.comment-sent').subscribe(msg => {
        this.notificationService.show(msg);
      });
      comment.ack = true;
    } else {
      if (this.userRole === 1 || this.userRole === 2 || this.userRole === 3) {
        this.translateService.get('comment-list.comment-sent').subscribe(msg => {
          this.notificationService.show(msg);
        });
        comment.ack = true;
      }
      if (this.userRole === 0) {
        this.translateService.get('comment-list.comment-sent-to-moderator').subscribe(msg => {
          this.notificationService.show(msg);
        });
      }
    }
    this.commentService.addComment(comment).subscribe();
  }

  private redraw(): void {
    if (this.child === undefined) {
      return;
    }
    this.lastDebounceTime = new Date().getTime();
    this.child.reDraw();
    this.isLoading = false;
    // This should fix the hover bug (scale was not turned off sometimes)
    this.child.cloudDataHtmlElements.forEach(elem => {
      elem.addEventListener('mouseleave', () => {
        elem.style.transform = elem.style.transform.replace(transformationScaleKiller, '').trim();
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
    const rules = customTagCloudStyles.sheet.cssRules;
    for (let i = rules.length - 1; i >= 0; i--) {
      customTagCloudStyles.sheet.deleteRule(i);
    }
    let textTransform = '';
    if (this._currentSettings.textTransform === CloudTextStyle.capitalized) {
      textTransform = 'text-transform: capitalize;';
    } else if (this._currentSettings.textTransform === CloudTextStyle.lowercase) {
      textTransform = 'text-transform: lowercase;';
    }
    const fontRange = (this._currentSettings.fontSizeMax - this._currentSettings.fontSizeMin) / 10;
    for (let i = 1; i <= 10; i++) {
      customTagCloudStyles.sheet.insertRule('.spacyTagCloud > span.w' + i +
        ', .spacyTagCloud > span.w' + i + ' > a { '
        + 'color: ' + this._currentSettings.cloudWeightSettings[i - 1].color + ';' +
        textTransform + ' font-size: ' +
        (this._currentSettings.fontSizeMin + fontRange * i).toFixed(0) + '%; }', rules.length);
    }
    customTagCloudStyles.sheet.insertRule('.spacyTagCloud > span:hover, .spacyTagCloud > span:hover > a { color: ' +
      this._currentSettings.fontColor + '; }', rules.length);
    customTagCloudStyles.sheet.insertRule('.spacyTagCloudContainer { background-color: ' +
      this._currentSettings.backgroundColor + '; }', rules.length);
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
    /*
    hoverScale, hoverTime, hoverDelay, delayWord can be updated without refreshing
     */
    const cssUpdates = ['backgroundColor', 'fontColor', 'fontSizeMin', 'fontSizeMax', 'textTransform'];
    const dataUpdates = ['randomAngles', 'sortAlphabetically', 'checkSpelling'];
    const cssWeightUpdates = ['color'];
    const dataWeightUpdates = ['maxVisibleElements', 'rotation'];
    //data updates
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
    //css updates
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
