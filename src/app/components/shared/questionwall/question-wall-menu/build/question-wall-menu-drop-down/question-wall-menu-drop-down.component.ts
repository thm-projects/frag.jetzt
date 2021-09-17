import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Inject, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { QUESTION_WALL_MENU_DROP_DOWN_CONFIG, QuestionWallMenuDropDownConfig } from './question-wall-menu-drop-down-config';
import { ArsAnchor, ArsObserver } from '../../../../../../../../projects/ars/src/lib/models/util/ArsObserver';
import { ComposeHostDirective } from '../../../../../../../../projects/ars/src/lib/compose/compose-host.directive';
import { QuestionWallMenuBuilder } from '../../question-wall-menu-builder';

@Component({
  selector: 'app-question-wall-menu-drop-down',
  templateUrl: './question-wall-menu-drop-down.component.html',
  styleUrls: ['./question-wall-menu-drop-down.component.scss']
})
export class QuestionWallMenuDropDownComponent implements OnInit,AfterViewInit {

  public expandedAnchor:ArsAnchor<boolean>;

  constructor(
    private cdr:ChangeDetectorRef,
    @Inject(QUESTION_WALL_MENU_DROP_DOWN_CONFIG) public data:QuestionWallMenuDropDownConfig
  ) {
    this.expandedAnchor=data.expanded.createAnchor();
  }

  @ViewChild(ComposeHostDirective) set content(content: ComposeHostDirective) {
    this.data.compose(content);
    this.cdr.detectChanges();
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(){
  }

  toggle(){
    this.data.expanded.set(!this.data.expanded.get());
    this.cdr.detectChanges();
  }

}
