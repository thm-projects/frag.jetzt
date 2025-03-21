import { Component, inject } from '@angular/core';
import {
  BuiltAction,
  DYNAMIC_INPUT,
  TextAction,
} from '../interface/multi-level-dialog.types';

@Component({
  selector: 'app-multi-level-text',
  templateUrl: './multi-level-text.component.html',
  styleUrls: ['./multi-level-text.component.scss'],
  standalone: false,
})
export class MultiLevelTextComponent {
  data = inject(DYNAMIC_INPUT) as BuiltAction<TextAction>;
}
