import {AfterViewInit, Component, OnDestroy, OnInit} from "@angular/core";
import {ArsListener} from "./ars-listener";

@Component({
  template: ''
})
export class ArsLifeCycleVisitor implements OnInit, AfterViewInit, OnDestroy {

  private readonly onInitListener:ArsListener<void>=new ArsListener<void>();
  private readonly afterViewInitListener:ArsListener<void>=new ArsListener<void>();
  private readonly onDestroyListener:ArsListener<void>=new ArsListener<void>();

  ngOnInit() {
    this.onInitListener.run();
  }

  ngAfterViewInit() {
    this.afterViewInitListener.run();
  }

  ngOnDestroy() {
    this.onDestroyListener.run();
  }

  public onInit(init:()=>void){
    this.onInitListener.addListener(init);
  }

  public onAfterViewInit(viewInit:()=>void){
    this.afterViewInitListener.addListener(viewInit);
  }

  public onDestroy(destroy:()=>void){
    this.onDestroyListener.addListener(destroy);
  }

}
