import {
  DestroyRef,
  Directive,
  HostListener,
  Input,
  TemplateRef,
} from '@angular/core';
import { M3NavigationService } from '../../../services/navigation/m3-navigation.service';
import { M3NavigationKind } from '../m3-nav-types';

@Directive({
  selector: '[m3NavDrawerTriggerFor]',
  standalone: true,
})
export class M3NavDrawerTriggerForDirective {
  @Input('m3NavDrawerTriggerFor') _templateRef!: TemplateRef<any>;

  constructor(
    private readonly navigationService: M3NavigationService,
    private readonly destroyRef: DestroyRef,
  ) {
    console.log(destroyRef);
    destroyRef.onDestroy(() => {
      console.log('destroyed', this);
    });
  }

  @HostListener('click', ['$event']) _click($event: MouseEvent) {
    this.navigationService.build(M3NavigationKind.Drawer, this._templateRef);
  }
}
