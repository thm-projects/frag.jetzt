import { Component, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { KatexOptions, MarkdownService, PrismPlugin } from 'ngx-markdown';

@Component({
  selector: 'app-custom-markdown',
  template: '<ng-content></ng-content>',
  styleUrls: ['./custom-markdown.component.scss']
})
export class CustomMarkdownComponent implements OnChanges {
  @Input() katex = true;
  @Input() emoji = true;
  @Input() lineNumbers = true;
  @Input() lineHighlight = true;
  @Input() start: number | undefined;
  @Input() line: string | string[] | undefined;
  @Input() lineOffset: number | undefined;
  @Input() isRawHTML = false;
  @Input() katexOptions: KatexOptions = {
    throwOnError: true
  };
  @Input() data: string;

  constructor(public element: ElementRef<HTMLElement>,
              public markdownService: MarkdownService) {
  }

  private static setPluginClass(element: HTMLElement, plugin: string | string[]): void {
    const preElements = element.querySelectorAll('pre');
    for (let i = 0; i < preElements.length; i++) {
      const classes = plugin instanceof Array ? plugin : [plugin];
      preElements.item(i).classList.add(...classes);
    }
  }

  private static setPluginOptions(element: HTMLElement, options: { [key: string]: number | string | string[] | undefined }): void {
    const preElements = element.querySelectorAll('pre');
    for (let i = 0; i < preElements.length; i++) {
      Object.keys(options).forEach(option => {
        const attributeValue = options[option];
        if (attributeValue) {
          const attributeName = this.toLispCase(option);
          preElements.item(i).setAttribute(attributeName, attributeValue.toString());
        }
      });
    }
  }

  private static toLispCase(value: string): string {
    const upperChars = value.match(/([A-Z])/g);
    if (!upperChars) {
      return value;
    }
    let str = value.toString();
    for (let i = 0, n = upperChars.length; i < n; i++) {
      str = str.replace(new RegExp(upperChars[i]), '-' + upperChars[i].toLowerCase());
    }
    if (str.slice(0, 1) === '-') {
      str = str.slice(1);
    }
    return str;
  }

  private static fixKatex(markdown: string): string {
    const regexp = /\${1,2}[^$]+\${1,2}/g;
    let newStr = '';
    let lastIndex = 0;
    let match: RegExpExecArray;
    while ((match = regexp.exec(markdown)) !== null) {
      if (match.index === regexp.lastIndex) {
        regexp.lastIndex++;
      }
      newStr += markdown.substring(lastIndex, match.index) + match[0].replace('\\\\', '\\\\\\\\');
      lastIndex = match.index + match[0].length;
    }
    newStr += markdown.substring(lastIndex);
    return newStr;
  }

  private static decodeHTML(encodedHTML: string) {
    const elem = document.createElement('textarea');
    elem.innerHTML = encodedHTML;
    return elem.value;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.data != null) {
      this.render(this.data);
    }
  }

  private render(markdown: string, decodeHtml = false): void {
    if (this.isRawHTML) {
      this.element.nativeElement.innerHTML = this.renderKatex(markdown);
      return;
    }
    if (this.katex) {
      markdown = CustomMarkdownComponent.fixKatex(markdown);
    }
    const compiled = this.markdownService.compile(markdown, decodeHtml, this.emoji);
    this.element.nativeElement.innerHTML = this.katex ? this.renderKatex(compiled) : compiled;
    if (this.lineHighlight) {
      CustomMarkdownComponent.setPluginOptions(this.element.nativeElement, {
        dataLine: this.line,
        dataLineOffset: this.lineOffset
      });
    }
    if (this.lineNumbers) {
      CustomMarkdownComponent.setPluginClass(this.element.nativeElement, PrismPlugin.LineNumbers);
      CustomMarkdownComponent.setPluginOptions(this.element.nativeElement, { dataStart: this.start });
    }
    this.markdownService.highlight(this.element.nativeElement);
  }

  private renderKatex(compiledMarkdown: string): string {
    const regexp = /\${1,2}[^$]+\${1,2}/g;
    let newStr = '';
    let lastIndex = 0;
    let match: RegExpExecArray;
    while ((match = regexp.exec(compiledMarkdown)) !== null) {
      if (match.index === regexp.lastIndex) {
        regexp.lastIndex++;
      }
      newStr += compiledMarkdown.substring(lastIndex, match.index);
      const katex = match[0];
      lastIndex = match.index + katex.length;
      this.katexOptions.displayMode = katex.startsWith('$$') && katex.endsWith('$$');
      const offset = this.katexOptions.displayMode ? 2 : 1;
      const innerKatex = CustomMarkdownComponent.decodeHTML(katex.substring(offset, katex.length - offset))
        .replace(/(^\s*)|(\s+$)/g, '');
      newStr += this.markdownService.renderKatex('$' + innerKatex + '$', this.katexOptions);
    }
    newStr += compiledMarkdown.substring(lastIndex);
    return newStr;
  }

}
