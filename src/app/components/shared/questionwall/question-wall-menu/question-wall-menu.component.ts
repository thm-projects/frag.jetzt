import { AfterViewInit, Component, Directive, Input, OnInit, ViewChild } from '@angular/core';
import { QuestionWallComponent } from '../question-wall/question-wall.component';
import { TranslateService } from '@ngx-translate/core';
import { R3DirectiveDef } from '@angular/compiler';
import { ArsAnchor, ArsObserver } from '../../../../../../projects/ars/src/lib/models/util/ArsObserver';
import { QuestionWallMenuBuilder } from './question-wall-menu-builder';
import { ComposeHostDirective } from '../../../../../../projects/ars/src/lib/compose/compose-host.directive';
import { ComposeService } from '../../../../../../projects/ars/src/lib/service/compose.service';

@Component({
  selector: 'app-question-wall-menu',
  templateUrl: './question-wall-menu.component.html',
  styleUrls: ['./question-wall-menu.component.scss'],
})
export class QuestionWallMenuComponent implements OnInit, AfterViewInit {

  @Input() public questionwall:QuestionWallComponent;
  private menuState:ArsObserver<boolean>;
  public menuStateAnchor:ArsAnchor<boolean>;
  private config:QuestionWallMenuBuilder;
  @ViewChild(ComposeHostDirective)host:ComposeHostDirective;

  constructor(
    public translate:TranslateService,
    public composeService:ComposeService
  ) { }

  ngOnInit(): void {
    this.menuState=ArsObserver.build(e=>{
      e.set(false);
    });
    this.menuStateAnchor=this.menuState.createAnchor();
    let firstPass=false;
    this.menuState.onChange(e=>{
      if(e.get()&&!firstPass){
        let interval=setInterval(()=>{
          if(this.host){
            this.config=new QuestionWallMenuBuilder(this.questionwall,this,this.composeService);
            this.config.build(this.host);
            firstPass=true;
            clearInterval(interval);
          }
        },100);
      }
      else{
        if(this.config){
          this.config.destroy();
          firstPass=false;
        }
      }
    });
  }

  ngAfterViewInit(){
  }

  toggle(){
    this.menuState.set(!this.menuState.get());
  }

}
