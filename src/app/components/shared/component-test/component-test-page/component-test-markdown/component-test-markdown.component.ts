import { Component, computed, signal } from '@angular/core';
import { MD_EXAMPLE } from '../../../../../custom-markdown/markdown-common/plugins';
import { CustomMarkdownModule } from '../../../../../custom-markdown/custom-markdown.module';

@Component({
  selector: 'app-component-test-markdown',
  standalone: true,
  imports: [CustomMarkdownModule],
  templateUrl: './component-test-markdown.component.html',
  styleUrl: './component-test-markdown.component.scss',
})
export class ComponentTestMarkdownComponent {
  protected markdownSignal = signal(MD_EXAMPLE);
  protected count = computed(() => this.markdownSignal().length);
}
