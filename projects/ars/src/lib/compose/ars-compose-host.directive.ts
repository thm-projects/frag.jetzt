import { AfterViewInit, Directive, EventEmitter, Input, Output, ViewContainerRef } from '@angular/core';

@Directive({
    selector: '[arsComposeHost]',
    standalone: false
})
export class ArsComposeHostDirective implements AfterViewInit{

  @Input('ident') ident: any;
  @Output() onAfterViewInit: EventEmitter<void> = new EventEmitter<void>();

  constructor(
    public viewContainerRef: ViewContainerRef
  ){
  }

  ngAfterViewInit(){
    this.onAfterViewInit.emit();
  }

}
