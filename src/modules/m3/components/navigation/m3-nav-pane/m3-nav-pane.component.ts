import { Component, Input } from '@angular/core';
import { M3NavRailComponent } from '../m3-nav-rail/m3-nav-rail.component';
import { M3NavDrawerComponent } from '../m3-nav-drawer/m3-nav-drawer.component';

@Component({
  selector: 'm3-nav-pane',
  standalone: true,
  imports: [M3NavRailComponent, M3NavDrawerComponent],
  templateUrl: './m3-nav-pane.component.html',
  styleUrl: './m3-nav-pane.component.scss',
})
export class M3NavPaneComponent {}
