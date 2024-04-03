import {
  Component,
  ElementRef,
  Input,
  numberAttribute,
  ViewChild,
} from '@angular/core';
import { M3NavRailComponent } from '../m3-nav-rail/m3-nav-rail.component';
import { M3NavDrawerComponent } from '../m3-nav-drawer/m3-nav-drawer.component';
import { MatFabButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import {
  NgClass,
  NgComponentOutlet,
  NgForOf,
  NgIf,
  NgStyle,
  NgTemplateOutlet,
} from '@angular/common';
import { M3LabelButton } from '../../buttons/label-button';
import { M3Badge, M3Icon, M3Label } from '../../buttons/base';
import { MatList, MatListItem } from '@angular/material/list';
import { M3BodyPaneComponent } from '../../layout/m3-body-pane/m3-body-pane.component';
import { M3NavigationService } from '../../../services/navigation/m3-navigation.service';
import {
  M3LabelTemplate,
  M3NavigationTemplate,
  M3State,
} from '../../../services/navigation/m3-navigation-types';
import { animate, style, transition, trigger } from '@angular/animations';
import { Router } from '@angular/router';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';

@Component({
  selector: 'm3-nav-pane',
  standalone: true,
  imports: [
    M3NavRailComponent,
    M3NavDrawerComponent,
    MatIconButton,
    MatIcon,
    MatFabButton,
    NgTemplateOutlet,
    NgStyle,
    NgIf,
    M3LabelButton,
    M3Icon,
    M3Label,
    M3Badge,
    MatList,
    MatListItem,
    NgClass,
    M3BodyPaneComponent,
    NgForOf,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    NgComponentOutlet,
  ],
  host: {
    '[class]': `'m3-nav-pane ' + 'm3-elevation-z' + elevation `,
  },
  templateUrl: './m3-nav-pane.component.html',
  styleUrl: './m3-nav-pane.component.scss',
  animations: [
    trigger('M3SectionAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('100ms', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('100ms', style({ opacity: 0 }))]),
    ]),
  ],
})
export class M3NavPaneComponent {
  extended: boolean = false;

  @Input({ transform: numberAttribute })
  set elevation(value: number) {
    this._elevation = value;
  }

  get elevation() {
    return this._elevation;
  }

  private _elevation: number = 1;
  private _currentTemplate: M3NavigationTemplate | undefined;

  @ViewChild('content', { static: true, read: ElementRef }) set _element(
    ref: ElementRef,
  ) {
    // const element = ref.nativeElement as HTMLDivElement;
    // element.addEventListener('scroll', (e) => {
    //   //todo(lph)
    // });
  }

  constructor(
    m3NavigationService: M3NavigationService,
    public readonly router: Router,
  ) {
    m3NavigationService.template.subscribe((x) => {
      if (x) {
        this._currentTemplate = x;
        this.elevation = x.elevation;
      } else {
        this._currentTemplate = undefined;
      }
    });
  }

  get template() {
    return this._currentTemplate;
  }

  protected readonly M3State = M3State;

  applyLabelAction(label: M3LabelTemplate) {
    if (label.action) {
      label.action();
    } else if (label.route) {
      this.router.navigate(label.route.commands, label.route.extras);
    }
  }
}
