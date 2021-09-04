import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[arsComposeHost]'
})
export class ComposeHostDirective {

  constructor(
    public viewContainerRef:ViewContainerRef
  ) { }

}
