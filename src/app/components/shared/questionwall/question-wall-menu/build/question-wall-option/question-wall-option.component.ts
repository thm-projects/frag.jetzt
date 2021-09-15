import { AfterViewInit, ChangeDetectorRef, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { QUESTION_WALL_OPTION_CONFIG, QuestionWallOptionConfig } from './question-wall-option-config';
import { ComposeHostDirective } from '../../../../../../../../projects/ars/src/lib/compose/compose-host.directive';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-question-wall-option',
  templateUrl: './question-wall-option.component.html',
  styleUrls: ['./question-wall-option.component.scss']
})
export class QuestionWallOptionComponent implements OnInit,AfterViewInit {

  @ViewChild(ComposeHostDirective)compose:ComposeHostDirective;
  constructor(
    public cdr:ChangeDetectorRef,
    @Inject(QUESTION_WALL_OPTION_CONFIG) public data:QuestionWallOptionConfig
  ) {
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(){
    this.data.compose(this.compose);
  }

}
