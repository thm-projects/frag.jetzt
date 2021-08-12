import { ComponentFactoryResolver, Directive, Input, OnInit, ViewContainerRef } from '@angular/core';
import { JoyrideDirective } from 'ngx-joyride';
import { JoyrideTemplateComponent } from '../components/shared/_dialogs/joyride-template/joyride-template.component';

@Directive({
  selector: '[appJoyrideTemplate]'
})
export class JoyrideTemplateDirective implements OnInit {

  @Input('appJoyrideTemplate') isPotentiallyFirstElement = false;

  constructor(private viewContainerRef: ViewContainerRef,
              public joyrideDirective: JoyrideDirective,
              private componentFactory: ComponentFactoryResolver) {
  }

  ngOnInit(): void {
    const factory = this.componentFactory.resolveComponentFactory(JoyrideTemplateComponent);
    const templates = this.viewContainerRef.createComponent(factory);
    if (this.isPotentiallyFirstElement) {
      this.joyrideDirective.doneTemplate = templates.instance.doneButton;
      this.joyrideDirective.nextTemplate = templates.instance.nextButton;
      this.joyrideDirective.prevTemplate = templates.instance.cancelButton;
      this.joyrideDirective.counterTemplate = templates.instance.counter;
    }
    this.joyrideDirective.stepContent = templates.instance.tempText;
  }

}
