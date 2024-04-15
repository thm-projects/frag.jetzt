import {
  booleanAttribute,
  Component,
  ElementRef,
  Input,
  numberAttribute,
  ViewChild,
} from '@angular/core';
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
  M3TemplateKind,
} from '../m3-navigation-types';
import { Router } from '@angular/router';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { M3ButtonTemplateList, M3LabelTemplateList } from './m3-nav-support';
import { M3WindowClassDirective } from '../../window-class/window-class';

@Component({
  selector: 'm3-nav-pane',
  standalone: true,
  imports: [
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
    M3LabelTemplateList,
    M3ButtonTemplateList,
    M3WindowClassDirective,
  ],
  host: {
    '[class]': `'m3-nav-pane ' + 'm3-elevation-z' + elevation `,
  },
  templateUrl: './m3-nav-pane.component.html',
  styleUrl: './m3-nav-pane.component.scss',
})
export class M3NavPaneComponent {
  protected _labelState: boolean = true;
  @Input({ transform: booleanAttribute })
  set extended(value: boolean) {
    if (this._extended === value) {
      return;
    }
    this.triggerLabelState();
  }

  get extended() {
    return this._extended;
  }

  private _extended: boolean = false;

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

  @ViewChild('extendedActionsContainer', {
    static: true,
    read: HTMLDivElement,
  })
  extendedActionsContainer: HTMLDivElement;

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

  get labelState() {
    return this._labelState;
  }

  get template() {
    return (
      this._currentTemplate || {
        kind: M3TemplateKind.Navigation,
        rail: {
          kind: M3TemplateKind.Rail,
          hide: true,
        },
        header: {
          kind: M3TemplateKind.Header,
        },
        elevation: 0,
      }
    );
  }

  protected readonly M3State = M3State;

  applyLabelAction(label: M3LabelTemplate) {
    if (label.click) {
      label.click();
    } else if (label.route) {
      this.router.navigate(label.route.commands, label.route.extras);
    }
  }

  protected readonly M3LabelTemplateList = M3LabelTemplateList;

  private triggerLabelState() {
    this._labelState = false;
    setTimeout(() => {
      this._extended = !this._extended;
      setTimeout(() => {
        this._labelState = true;
      }, 150);
    }, 50);
  }
}
