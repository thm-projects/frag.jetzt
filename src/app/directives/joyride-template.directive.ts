import {
  ComponentFactoryResolver,
  Directive,
  Input,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import { JoyrideDirective } from 'ngx-joyride';
import { JoyrideTemplateComponent } from '../components/shared/_dialogs/joyride-template/joyride-template.component';
import { EventService } from '../services/util/event.service';

@Directive({
  selector: '[appJoyrideTemplate]'
})
export class JoyrideTemplateDirective implements OnInit {

  @Input('appJoyrideTemplate') applyStyles = false;

  constructor(private viewContainerRef: ViewContainerRef,
              public joyrideDirective: JoyrideDirective,
              private eventService: EventService,
              private componentFactory: ComponentFactoryResolver) {
  }

  ngOnInit(): void {
    const factory = this.componentFactory.resolveComponentFactory(JoyrideTemplateComponent);
    const templates = this.viewContainerRef.createComponent(factory);
    templates.instance.name = this.joyrideDirective.name;
    if (this.applyStyles) {
      this.joyrideDirective.doneTemplate = templates.instance.doneButton;
      this.joyrideDirective.nextTemplate = templates.instance.nextButton;
      this.joyrideDirective.prevTemplate = templates.instance.prevButton;
      this.joyrideDirective.counterTemplate = templates.instance.counter;
    }
    this.joyrideDirective.stepContent = templates.instance.translateText;
    this.joyrideDirective.done.subscribe(_ => {
      this.eventService.broadcast('onboarding', 'canceled');
    });
  }

}
