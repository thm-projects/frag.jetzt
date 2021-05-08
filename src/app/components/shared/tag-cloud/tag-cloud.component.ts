import {AfterViewInit, Component, OnInit, ViewChild, Input} from '@angular/core';

import {
  CloudData,
  CloudOptions,
  Position,
  ZoomOnHoverOptions,
  TagCloudComponent as TCloudComponent
} from 'angular-tag-cloud-module';
import {CommentService} from '../../../services/http/comment.service';
import {Result, SpacyService} from '../../../services/http/spacy.service';
import {Comment} from '../../../models/comment';
import {LanguageService} from '../../../services/util/language.service';
import {TranslateService} from '@ngx-translate/core';
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
import {ThemeService} from '../../../../theme/theme.service';

class CustomPosition implements Position {
  left: number;
  top: number;

  constructor(public relativeLeft: number,
              public relativeTop: number) {
  }

  updatePosition(width: number, height: number, text: string, style: CSSStyleDeclaration) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = style.font;
    const offsetY = parseInt(style.fontSize, 10) / 2;
    const offsetX = context.measureText(text).width / 2;
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
  string // w10
];

const colorRegex = /rgba?\((\d+), (\d+), (\d+)(?:, (\d(?:\.\d+)?))?\)/;
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
  'var(--light-green, brown)' // w10
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
};

@Component({
  selector: 'app-tag-cloud',
  templateUrl: './tag-cloud.component.html',
  styleUrls: ['./tag-cloud.component.scss']
})
export class TagCloudComponent implements OnInit {

  @ViewChild(TCloudComponent, {static: false}) child: TCloudComponent;
  @Input() user: User;
  @Input() roomId: string;
  room: Room;
  headerInterface = null;
  directSend = true;
  shortId: string;
  options: CloudOptions = {
    // if width is between 0 and 1 it will be set to the width of the upper element multiplied by the value
    width: 0.99,
    // if height is between 0 and 1 it will be set to the height of the upper element multiplied by the value
    height: 0.99,
    overflow: false,
    font: 'Georgia' // not working
  };
  zoomOnHoverOptions: ZoomOnHoverOptions = {
    scale: 1.3, // Elements will become 130 % of current size on hover
    transitionTime: 0.6, // it will take 0.6 seconds until the zoom level defined in scale property has been reached
    delay: 0.4,// Zoom will take affect after 0.4 seconds
    color: 'red'
  };
  userRole: UserRole;
  data: CloudData[] = [];
  sorted = false;


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
              private themeService: ThemeService) {
    this.roomId = localStorage.getItem('roomId');
    this.langService.langEmitter.subscribe(lang => {
      this.translateService.use(lang);
    });
  }

  ngOnInit(): void {
    this.headerInterface = this.eventService.on<string>('navigate').subscribe(e => {
      if (e === 'createQuestion') {
        this.openCreateDialog();
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
    this.commentService.getAckComments(this.roomId).subscribe((comments: Comment[]) => {
      this.analyse(comments);
    });
    this.resetColorsToTheme();
    this.themeService.getTheme().subscribe(() => {
      this.resetColorsToTheme();
      if (this.child) {
        setTimeout(() => {
          this.updateTagCloud();
        }, 1);
      }
    });
  }
  resetColorsToTheme() {
    setGlobalStyles(getResolvedDefaultColors()
      .map(e => 'color: ' + e + ' !important;') as TagCloudStyleData);
  }

  analyse(comments: Comment[]) {
    const commentsConcatenated = comments.map(c => c.body).join(' ');

    this.spacyService.analyse(commentsConcatenated, 'de').subscribe((res: Result) => {
      const map = new Map<string, number>();
      res.words.filter(w => ['NE', 'NN', 'NMP', 'NNE'].indexOf(w.tag) >= 0).forEach(elem => {
        const count = (map.get(elem.text) || 0) + 1;
        map.set(elem.text, count);
      });
      map.forEach((val, key) => {
          this.data.push(new TagComment(null,
            true, null, null,
            /*Math.floor(Math.random() * 30 - 15)*/0, key,
            'TODO', val));
        }
      );
      this.sortPositionsAlphabetically(this.sorted);
      this.updateTagCloud();
    });
  }

  drawerOpen(): boolean {
    return true;
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

  updateTagCloud() {
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
    this.child.reDraw();
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateCommentComponent, {
      width: '900px',
      maxWidth: 'calc( 100% - 50px )',
      maxHeight: 'calc( 100vh - 50px )',
      autoFocus: false,
    });
    console.log(this.user, this.roomId, this.room);
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
}
