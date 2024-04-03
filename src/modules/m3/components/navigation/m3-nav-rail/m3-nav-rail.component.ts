import { Component, HostBinding, TemplateRef } from '@angular/core';
import { NgIf, NgTemplateOutlet } from '@angular/common';
import { M3NavigationService } from '../../../services/navigation/m3-navigation.service';

@Component({
  selector: 'm3-nav-rail',
  standalone: true,
  imports: [NgTemplateOutlet, NgIf],
  templateUrl: './m3-nav-rail.component.html',
  styleUrl: './m3-nav-rail.component.scss',
})
export class M3NavRailComponent {
  protected template: TemplateRef<any> | undefined;

  @HostBinding('class.hide') get _classHide() {
    return !this.template;
  }

  constructor(private readonly navigationService: M3NavigationService) {
    // this.navigationService.on(M3NavigationKind.Rail).subscribe((data) => {
    //   this.template = data?.template;
    // });
  }
}
