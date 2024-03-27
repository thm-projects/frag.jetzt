import {
  ChangeDetectorRef,
  Component,
  HostBinding,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import { NgIf, NgTemplateOutlet } from '@angular/common';
import { M3NavigationService } from '../../../services/navigation/m3-navigation.service';
import { M3NavigationKind } from '../m3-nav-types';

@Component({
  selector: 'm3-nav-drawer',
  standalone: true,
  imports: [NgIf, NgTemplateOutlet],
  templateUrl: './m3-nav-drawer.component.html',
  styleUrl: './m3-nav-drawer.component.scss',
})
export class M3NavDrawerComponent {
  protected template: TemplateRef<any> | undefined;
  @HostBinding('class.m3-nav-drawer') _ = true;
  @HostBinding('class.hide') get _classHide() {
    return !this.template;
  }
  constructor(private readonly navigationService: M3NavigationService) {
    this.navigationService.on(M3NavigationKind.Drawer).subscribe((data) => {
      this.template = data.template;
    });
  }
}
