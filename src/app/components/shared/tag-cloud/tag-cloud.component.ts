import {Component, OnInit, ViewChild} from '@angular/core';


import {CloudData, CloudOptions, Position, ZoomOnHoverOptions} from 'angular-tag-cloud-module';
import {CommentService} from "../../../services/http/comment.service";
import {QuestionWallComment} from "../questionwall/QuestionWallComment";
import {Observable, of} from "rxjs";
import {Result, SpacyService} from "../../../services/http/spacy.service";
import {Comment} from "../../../models/comment";
import {Rescale} from "../../../models/rescale";

class TagComment implements CloudData {
  constructor(
              public color: string,
              public external: boolean,
              public link: string,
              public position: Position,
              public rotate: number,
              public text: string,
              public tooltip: string,
              public weight: number) {
  }
 }
const COLOR: string[] = ["red", "green", "blue", "yellow", "orange"];
@Component({
  selector: 'app-tag-cloud',
  templateUrl: './tag-cloud.component.html',
  styleUrls: ['./tag-cloud.component.scss']
})
export class TagCloudComponent implements OnInit {

  @ViewChild(TagCloudComponent, { static: false }) child: TagCloudComponent;
  roomId: string;
  options: CloudOptions = {
    // if width is between 0 and 1 it will be set to the width of the upper element multiplied by the value
    width: 1,
    // if height is between 0 and 1 it will be set to the height of the upper element multiplied by the value
    height: 1,
    overflow: false,
  };
  zoomOnHoverOptions: ZoomOnHoverOptions = {
    scale: 1.3, // Elements will become 130 % of current zize on hover
    transitionTime: 0.6, // it will take 0.6 seconds until the zoom level defined in scale property has been reached
    delay: 0.4 // Zoom will take affect after 0.8 seconds
  };


   data: CloudData[] = [];


  constructor(private commentService: CommentService, private spacyService: SpacyService) {
    this.roomId = localStorage.getItem('roomId');
  }

  ngOnInit(): void {
    this.commentService.getAckComments(this.roomId).subscribe((comments: Comment[]) => {
      this.analyse(comments)
    });
  }


  analyse(comments: Comment[]) {
    const commentsConcatenated = comments.map(c => c.body).join(" ");

    this.spacyService.analyse(commentsConcatenated, "de").subscribe((res: Result) => {

      this.data = res.words.filter(w => w.tag === "NE" || w.tag === "NN" || w.tag === "NMP" || w.tag == "NNE").map(w =>

          new TagComment(COLOR[Math.floor(
            Math.random()*(COLOR.length-1))],
            true, null, null,
            Math.floor(Math.random()*30-15), w.text,
            "todo", Math.floor(Math.random()*10)+1)
      )
      }
    );
  }
  tagClicked(clicked: CloudData) {
    console.log(clicked);
  }


}
