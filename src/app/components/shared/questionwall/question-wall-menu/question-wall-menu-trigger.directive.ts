import { Directive, ElementRef, HostListener, Input, OnInit } from '@angular/core';
import { QuestionWallMenuComponent } from './question-wall-menu.component';

@Directive({
  selector: '[questionwallMenuTriggerFor]'
})
export class QuestionWallMenuTriggerDirective implements OnInit {

  @Input('questionwallMenuTriggerFor') questionwall:QuestionWallMenuComponent=null;

  constructor(private el: ElementRef) {
  }

  ngOnInit(){
  }

  @HostListener('click') onClick(){
    this.questionwall.toggle();
  }

}
