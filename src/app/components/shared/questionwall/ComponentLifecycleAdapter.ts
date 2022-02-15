import { Runnable } from './QuestionWallUtil';
import { AfterViewInit, Injectable, OnDestroy, OnInit } from '@angular/core';

export interface ComponentLifecycleListener{
  onInit(i:Runnable,capture?:boolean);
  onAfterViewInit(i:Runnable,capture?:boolean);
  onDestroy(i:Runnable,capture?:boolean);
}

@Injectable()
export class ComponentLifecycleAdapter implements ComponentLifecycleListener,OnInit,AfterViewInit,OnDestroy {

  private onInitListener:Runnable[]=[];
  private onAfterViewInitListener:Runnable[]=[];
  private onDestroyListener:Runnable[]=[];

  onInit(i: Runnable, capture?: boolean){
    if(capture){
      this.onInitListener=[i].concat(this.onInitListener);
    }
    else{
      this.onInitListener.push(i);
    }
  }

  onAfterViewInit(i: Runnable, capture?: boolean){
    if(capture){
      this.onAfterViewInitListener=[i].concat(this.onAfterViewInitListener);
    }
    else{
      this.onAfterViewInitListener.push(i);
    }
  }

  onDestroy(i: Runnable, capture?: boolean){
    if(capture){
      this.onDestroyListener=[i].concat(this.onDestroyListener);
    }
    else{
      this.onDestroyListener.push(i);
    }
  }

  ngOnInit(){
    this.onInitListener.forEach(e=>e());
  }

  ngAfterViewInit(){
    this.onAfterViewInitListener.forEach(e=>e());
  }

  ngOnDestroy(){
    this.onDestroyListener.forEach(e=>e());
  }


}
