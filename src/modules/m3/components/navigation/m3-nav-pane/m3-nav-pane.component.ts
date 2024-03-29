import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { M3NavRailComponent } from '../m3-nav-rail/m3-nav-rail.component';
import { M3NavDrawerComponent } from '../m3-nav-drawer/m3-nav-drawer.component';
import { MatFabButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { NgClass, NgIf, NgStyle, NgTemplateOutlet } from '@angular/common';
import { M3LabelButton } from '../../buttons/label-button';
import { M3Badge, M3Icon, M3Label } from '../../buttons/base';
import { MatList, MatListItem } from '@angular/material/list';

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
  ],
  templateUrl: './m3-nav-pane.component.html',
  styleUrl: './m3-nav-pane.component.scss',
})
export class M3NavPaneComponent {
  extended: boolean = false;

  @ViewChild('content', { static: true, read: ElementRef }) set _element(
    ref: ElementRef,
  ) {
    const element = ref.nativeElement as HTMLDivElement;
    element.addEventListener('scroll', (e) => {
      //todo(lph)
    });
  }
}
