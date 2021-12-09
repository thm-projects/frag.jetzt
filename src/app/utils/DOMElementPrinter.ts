export class DOMElementPrinter {
  private readonly iframe: HTMLIFrameElement;

  constructor(private parent: HTMLElement) {
    this.iframe = document.createElement('iframe');
    this.iframe.width = '1';
    this.iframe.height = '1';
    document.body.appendChild(this.iframe);
    this.refresh();
  }

  static printOnce(elem: HTMLElement, title: string, background: string = null) {
    const printer = new DOMElementPrinter(elem);
    printer.print(title, background);
    printer.clean();
  }

  private static clean(elem: HTMLElement) {
    while (elem.firstElementChild) {
      elem.removeChild(elem);
    }
  }

  clean() {
    this.iframe.remove();
  }

  print(title: string, background: string = null) {
    this.iframe.contentDocument.body.style.background = background;
    this.iframe.contentDocument.title = title;
    this.iframe.contentWindow.print();
  }

  refresh() {
    DOMElementPrinter.clean(this.iframe.contentDocument.head);
    DOMElementPrinter.clean(this.iframe.contentDocument.body);
    document.querySelectorAll('link[rel="stylesheet"], style').forEach(node => {
      const cloned = node.cloneNode(true);
      this.iframe.contentDocument.head.appendChild(cloned);
      if ((cloned as HTMLElement).tagName === 'STYLE') {
        const styleDoc = (node as HTMLStyleElement).sheet.cssRules;
        const newStyleDoc = (cloned as HTMLStyleElement).sheet;
        if (newStyleDoc.cssRules.length !== styleDoc.length) {
          while (newStyleDoc.cssRules.length) {
            newStyleDoc.deleteRule(0);
          }
          for (let i = 0; i < styleDoc.length; i++) {
            newStyleDoc.insertRule(styleDoc.item(i).cssText, newStyleDoc.cssRules.length);
          }
        }
      }
    });
    this.iframe.contentDocument.body.appendChild(this.parent.cloneNode(true));
  }
}
