import { Directive, OnInit, ViewContainerRef } from '@angular/core';
import { JoyrideDirective } from 'ngx-joyride';
import { JoyrideTemplateComponent } from '../components/shared/_dialogs/joyride-template/joyride-template.component';
import { EventService } from '../services/util/event.service';

@Directive({
  selector: '[appJoyrideTemplate]'
})
export class JoyrideTemplateDirective implements OnInit {

  constructor(private viewContainerRef: ViewContainerRef,
              public joyrideDirective: JoyrideDirective,
              private eventService: EventService) {
  }

  ngOnInit(): void {
    const templates = this.viewContainerRef.createComponent(JoyrideTemplateComponent);
    templates.instance.name = this.joyrideDirective.name;
    this.joyrideDirective.doneTemplate = templates.instance.doneButton;
    this.joyrideDirective.nextTemplate = templates.instance.nextButton;
    this.joyrideDirective.prevTemplate = templates.instance.prevButton;
    this.joyrideDirective.counterTemplate = templates.instance.counter;
    this.joyrideDirective.stepContent = templates.instance.translateText;
    this.joyrideDirective.done.subscribe(_ => {
      this.eventService.broadcast('onboarding', 'canceled');
    });
  }

}
