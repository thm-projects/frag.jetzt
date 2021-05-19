import { Component, OnInit, ViewChild, Input, AfterViewInit, OnDestroy } from '@angular/core';

import {
  CloudData,
  CloudOptions,
  Position,
  ZoomOnHoverOptions,
  TagCloudComponent as TCloudComponent
} from 'angular-tag-cloud-module';
import { CommentService } from '../../../services/http/comment.service';
import { Result, SpacyService } from '../../../services/http/spacy.service';
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
import { CloudParameters, CloudWeightColor, CloudWeightCount, TagCloudHeaderDataOverview } from './tag-cloud.interface';
import { TopicCloudAdministrationComponent } from '../_dialogs/topic-cloud-administration/topic-cloud-administration.component';
import { WsCommentServiceService } from '../../../services/websockets/ws-comment-service.service';

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

//CSS styles Array
type TagCloudStyleData = [
  string, // hover
  string, // w1
  string, // w2
  string, // w3
  string, // w4
  string, // w5
  string, // w6
  string, // w7
  string, // w8
  string, // w9
  string, // w10
  string // background
];

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

const setGlobalStyles = (styles: TagCloudStyleData): void => {
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
  for (let i = 1; i <= 10; i++) {
    customTagCloudStyles.sheet.insertRule('.spacyTagCloud > span.w' + i + ' { ' + styles[i] + ' }', rules.length);
    customTagCloudStyles.sheet.insertRule('.spacyTagCloud > span.w' + i + ' > a { ' + styles[i] + ' }', rules.length);
  }
  customTagCloudStyles.sheet.insertRule('.spacyTagCloud > span:hover { ' + styles[0] + ' }', rules.length);
  customTagCloudStyles.sheet.insertRule('.spacyTagCloud > span:hover > a { ' + styles[0] + ' }', rules.length);
  customTagCloudStyles.sheet.insertRule('.spacyTagCloudContainer {' + styles[11] + '}', rules.length);
};

const getDefaultCloudParameters = (): CloudParameters => {
  const resDefaultColors = getResolvedDefaultColors();
  const resWeightColors = resDefaultColors.slice(1, 11) as CloudWeightColor;
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
    cloudWeightColor: resWeightColors,
    cloudWeightCount: [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1]
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
  headerInterface = null;
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
  sorted = false;
  debounceTimer = 0;
  lastDebounceTime = 0;
  configurationOpen = false;
  randomizeAngle = false;
  isLoading = true;
  dataSize: CloudWeightCount;

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
  }

  ngOnInit(): void {
    this.headerInterface = this.eventService.on<string>('navigate').subscribe(e => {
      if (e === 'createQuestion') {
        this.openCreateDialog();
      } else if (e === 'topicCloudConfig') {
        this.configurationOpen = !this.configurationOpen;
      } else if (e === 'topicCloudAdministration') {
        this.dialog.open(TopicCloudAdministrationComponent, {
          minWidth: '50%'
        });
      }
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
    this.commentService.getFilteredComments(this.roomId).subscribe((comments: Comment[]) => {
      this.analyse(comments);
    });
    this.themeService.getTheme().subscribe(() => {
      if (this.child) {
        setTimeout(() => {
          this.setCloudParameters(this.getCurrentCloudParameters(), false);
        }, 1);
      }
    });
    this.wsCommentService.getCommentStream(this.roomId).subscribe(e => {
      this.commentService.getFilteredComments(this.roomId).subscribe((oldComments: Comment[]) => {
        this.analyse(oldComments);
      });
  });
  }

  ngAfterViewInit() {
    document.getElementById('footer_rescale').style.display = 'none';
  }

  ngOnDestroy() {
    document.getElementById('footer_rescale').style.display = 'block';
  }

  initTagCloud() {
    setTimeout(() => {
      this.setCloudParameters(this.getCurrentCloudParameters(), false);
    });
  }

  resetColorsToTheme() {
    this.setCloudParameters(getDefaultCloudParameters());
  }

  getCurrentCloudParameters(): CloudParameters {
    const jsonData = localStorage.getItem('tagCloudConfiguration');
    const elem: CloudParameters = jsonData != null ? JSON.parse(jsonData) : null;
    return elem || getDefaultCloudParameters();
  }

  setCloudParameters(data: CloudParameters, save = true): void {
    const arr = [data.fontColor, ...data.cloudWeightColor, data.backgroundColor];
    const fontRange = (data.fontSizeMax - data.fontSizeMin) / 10;
    const styles = arr.map((e, i) => {
      if (i > 10) {
        return 'background-color: ' + e + ';';
      } else if (i > 0) {
        return 'color: ' + e + '; font-size: ' + (data.fontSizeMin + fontRange * i).toFixed(0) + '%;';
      } else {
        return 'color: ' + e + ';';
      }
    });
    setGlobalStyles(styles as TagCloudStyleData);
    this.zoomOnHoverOptions.delay = data.hoverDelay;
    this.zoomOnHoverOptions.scale = data.hoverScale;
    this.zoomOnHoverOptions.transitionTime = data.hoverTime;
    this.options.delay = data.delayWord;
    this.randomizeAngle = data.randomAngles;
    this.dataSize = data.cloudWeightCount;
    this.rebuildData();
    this.updateTagCloud();
    if (save) {
      localStorage.setItem('tagCloudConfiguration', JSON.stringify(data));
    }
  }

  onResize(event: UIEvent): any {
    this.updateTagCloud();
  }

  sortPositionsAlphabetically(sort: boolean): void {
    if (!sort) {
      this.sorted = false;
      this.data.forEach(e => e.position = null);
      return;
    }
    this.sorted = true;
    if (!this.data.length) {
      return;
    }
    this.data.sort((a, b) => a.text.localeCompare(b.text));
    const lines = Math.floor(Math.sqrt(this.data.length - 1) + 1);
    const divided = Math.floor(this.data.length / lines);
    let remainder = this.data.length - divided * lines;
    for (let i = 0, line = 0; line < lines; line++) {
      const size = divided + (--remainder >= 0 ? 1 : 0);
      for (let k = 0; k < size; k++, i++) {
        this.data[i].position = new CustomPosition((k + 1) / (size + 1), (line + 1) / (lines + 1));
      }
    }
  }

  analyse(comments: Comment[]) {
    const commentsConcatenated = comments.map(c => c.body).join(' ');
    const userSet = new Set<number>();
    comments.forEach(comment => {
      userSet.add(comment.userNumber);
    });

    this.spacyService.analyse(commentsConcatenated, 'de').subscribe((res: Result) => {
      const map = new Map<string, number>();
      res.words.filter(w => ['NE', 'NN', 'NMP', 'NNE'].indexOf(w.tag) >= 0).forEach(elem => {
        const count = (map.get(elem.text) || 0) + 1;
        map.set(elem.text, count);
      });
      this.eventService.broadcast('tagCloudHeaderDataOverview', {
        commentCount: comments.length,
        userCount: userSet.size,
        tagCount: map.size
      } as TagCloudHeaderDataOverview);
      this.data.length = 0;
      map.forEach((val, key) => {
          this.data.push(new TagComment(null,
            true, null, null,
            this.randomizeAngle ? Math.floor(Math.random() * 30 - 15) : 0, key,
            'TODO', val));
        }
      );
      this.sortPositionsAlphabetically(this.sorted);
      this.updateTagCloud();
    });
  }

  rebuildData() {
    if (this.randomizeAngle) {
      this.data.forEach(e => e.rotate = Math.floor(Math.random() * 30 - 15));
    } else {
      this.data.forEach(e => e.rotate = 0);
    }
    //TODO Sort using votes and keys
  }

  updateTagCloud() {
    this.isLoading = true;
    if (this.sorted && this.data.length) {
      if (!this.child.cloudDataHtmlElements || !this.child.cloudDataHtmlElements.length) {
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

}
