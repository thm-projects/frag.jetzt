import { Component, effect, HostBinding, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-assistant-upload',
  standalone: true,
  imports: [
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './assistant-upload.component.html',
  styleUrl: './assistant-upload.component.scss',
})
export class AssistantUploadComponent {
  name = input.required<string>();
  state = input.required<'uploading' | 'uploaded' | 'failed'>();
  progress = input.required<number>();
  remove = output<void>();

  @HostBinding('class')
  classes: string[] = [];

  constructor() {
    effect(() => {
      const state = this.state();
      if (state === 'failed') {
        this.classes = ['failed'];
      }
    });
  }
}
