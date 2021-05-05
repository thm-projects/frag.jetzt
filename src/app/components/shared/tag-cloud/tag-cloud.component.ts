import {Component, OnInit, ViewChild} from '@angular/core';

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

const weight2color = {
  1: 'blue',
  2: 'green',
  3: 'yellow',
  4: 'orange',
  5: 'pink',
  6: 'gray',
  7: 'lightgreen',
  8: 'tomato',
  9: 'white',
  10: 'brown'
};

@Component({
  selector: 'app-tag-cloud',
  templateUrl: './tag-cloud.component.html',
  styleUrls: ['./tag-cloud.component.scss']
})
export class TagCloudComponent implements OnInit {

  @ViewChild(TCloudComponent, {static: false}) child: TCloudComponent;
  roomId: string;
  options: CloudOptions = {
    // if width is between 0 and 1 it will be set to the width of the upper element multiplied by the value
    width: 1,
    // if height is between 0 and 1 it will be set to the height of the upper element multiplied by the value
    height: 1,
    overflow: false,
    font: 'Georgia' // not working
  };
  zoomOnHoverOptions: ZoomOnHoverOptions = {
    scale: 1.3, // Elements will become 130 % of current size on hover
    transitionTime: 0.6, // it will take 0.6 seconds until the zoom level defined in scale property has been reached
    delay: 0.4,// Zoom will take affect after 0.4 seconds
    color: 'red'
  };

  data: CloudData[] = [];


  constructor(private commentService: CommentService,
              private spacyService: SpacyService,
              private langService: LanguageService,
              private translateService: TranslateService) {
    this.roomId = localStorage.getItem('roomId');
    this.langService.langEmitter.subscribe(lang => {
      this.translateService.use(lang);
    });
  }

  ngOnInit(): void {
    this.translateService.use(localStorage.getItem('currentLang'));
    this.commentService.getAckComments(this.roomId).subscribe((comments: Comment[]) => {
      this.analyse(comments);
    });
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
      this.child.reDraw();
    });

  }
}
