import { AfterViewInit, Directive, EventEmitter, Output, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[arsComposeHost]'
})
export class ComposeHostDirective implements AfterViewInit{

  @Output() onAfterViewInit:EventEmitter<void>=new EventEmitter<void>();

  constructor(
    public viewContainerRef:ViewContainerRef
  ) { }

  ngAfterViewInit(){
    this.onAfterViewInit.emit();
  }

}
