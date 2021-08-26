import { LanguagetoolResult } from '../../../services/http/languagetool.service';

export class Marks {

  private textErrors: Mark[] = [];

  constructor(private markContainer: HTMLDivElement,
              private tooltipContainer: HTMLDivElement,
              private editor: HTMLDivElement) {
  }

  clear() {
    for (const textError of this.textErrors) {
      textError.remove();
    }
    this.textErrors.length = 0;
  }

  onClick(range: Range) {
    for (const textError of this.textErrors) {
      textError.close();
      if (range) {
        textError.open(range);
      }
    }
  }

  onDataChange(delta): void {
    let index = 0;
    for (const op of delta.ops) {
      if (op['insert']) {
        const len = op['insert'].length;
        for (const textError of this.textErrors) {
          if (index > textError.endIndex) {
            continue;
          }
          textError.endIndex += len;
          if (index >= textError.startIndex) {
            continue;
          }
          textError.startIndex += len;
        }
        index += len;
      } else if (op['retain']) {
        index += op['retain'];
      } else if (op['delete']) {
        const len = op['delete'];
        const endDelete = index + len;
        this.textErrors = this.textErrors.filter((textError) => {
          if (index >= textError.endIndex) {
            return true;
          }
          if (index > textError.startIndex) {
            if (endDelete < textError.endIndex) {
              textError.endIndex -= len;
              return true;
            }
            textError.endIndex = index;
            return true;
          }
          if (endDelete < textError.startIndex) {
            textError.startIndex -= len;
            textError.endIndex -= len;
            return true;
          }
          if (endDelete < textError.endIndex) {
            const errLen = textError.endIndex - endDelete;
            textError.startIndex = index;
            textError.endIndex = index + errLen;
            return true;
          }
          textError.remove();
          return false;
        });
      } else {
        console.log(op);
      }
    }
    let currentElement: Node = this.editor;
    let currentOffset = 0;
    let depth = 0;
    for (const error of this.textErrors) {
      [currentElement, currentOffset, depth] = error.rebuildMark(depth, currentElement, currentOffset);
    }
  }

  buildErrors(initialText: string, wrongWords: string[], res: LanguagetoolResult): void {
    let currentElement: Node = this.editor;
    let currentOffset = 0;
    let depth = 0;
    for (let i = 0; i < res.matches.length; i++) {
      const match = res.matches[i];
      const foundWord = initialText.slice(match.offset, match.offset + match.length);
      if (!wrongWords.includes(foundWord)) {
        continue;
      }
      const mark = new Mark(match.offset, match.offset + match.length, this.markContainer, this.tooltipContainer);
      [currentElement, currentOffset, depth] = mark.rebuildMark(depth, currentElement, currentOffset);
      mark.setSuggestions(res, i, () => {
        const index = this.textErrors.findIndex(elem => elem === mark);
        if (index >= 0) {
          this.textErrors.splice(index, 1);
        }
        mark.remove();
      });
      this.textErrors.push(mark);
    }
  }

  sync(): void {
    const parentRect = this.markContainer.getBoundingClientRect();
    for (const error of this.textErrors) {
      error.syncMark(parentRect);
    }
  }
}

interface MarkedRange {
  mark: HTMLSpanElement;
  range: Range;
}

class Mark {

  private marks: MarkedRange[] = [];
  private textRange: Range;
  private dropdown: HTMLDivElement;

  constructor(public startIndex,
              public endIndex,
              private markContainer: HTMLDivElement,
              private tooltipContainer: HTMLDivElement) {
  }

  private static calcNodeTextSize(node: Node): number {
    if (node instanceof HTMLBRElement) {
      return 1;
    }
    return node.textContent.length;
  }

  private static findNode(depth: number,
                          currentElement: Node,
                          currentOffset: number,
                          target: number,
                          onNodeLeave?: (Node) => void): [Node, number, number] {
    while (currentElement.firstChild) {
      currentElement = currentElement.firstChild;
      depth += 1;
    }
    let length = Mark.calcNodeTextSize(currentElement);
    while (currentOffset + length <= target) {
      if (onNodeLeave) {
        onNodeLeave(currentElement);
      }
      currentOffset += length;
      const wasAlreadyBreak = currentElement instanceof HTMLBRElement;
      let currentBefore = currentElement.parentElement;
      currentElement = currentElement.nextSibling;
      while (!currentElement) {
        if (depth <= 1) {
          throw new Error('The requested text position was not inside the container.');
        }
        if (depth === 2 && !wasAlreadyBreak) {
          currentOffset += 1;
        }
        currentElement = currentBefore.nextSibling;
        currentBefore = currentBefore.parentElement;
        depth -= 1;
      }
      while (currentElement.firstChild) {
        currentElement = currentElement.firstChild;
        depth += 1;
      }
      length = Mark.calcNodeTextSize(currentElement);
    }
    return [currentElement, currentOffset, depth];
  }

  isCollapsed(): boolean {
    return this.marks.some(range => range.range.collapsed);
  }

  rebuildMark(depth: number, currentElement: Node, currentOffset: number): [Node, number, number] {
    this.textRange = document.createRange();
    for (const mark of this.marks) {
      mark.mark.remove();
    }
    this.marks.length = 0;
    [currentElement, currentOffset, depth] = Mark.findNode(depth, currentElement, currentOffset, this.startIndex);
    let rangeStart = this.startIndex - currentOffset;
    rangeStart = rangeStart === -1 ? 0 : rangeStart;
    this.textRange.setStart(currentElement, rangeStart);
    [currentElement, currentOffset, depth] = Mark.findNode(depth, currentElement, currentOffset, this.endIndex - 1,
      (node: Node) => {
        const currentRange = this.textRange.cloneRange();
        if (currentRange.startContainer !== node) {
          currentRange.setStart(node, 0);
        }
        currentRange.setEnd(node, node.textContent.length);
        this.marks.push(this.createMarkedRange(currentRange));
      });
    const rangeEnd = this.endIndex - currentOffset;
    this.textRange.setEnd(currentElement, rangeEnd);
    if (this.textRange.startContainer !== this.textRange.endContainer) {
      const currentRange = this.textRange.cloneRange();
      currentRange.setStart(currentElement, 0);
      this.marks.push(this.createMarkedRange(currentRange));
    } else {
      this.marks.push(this.createMarkedRange(this.textRange));
    }

    return [currentElement, currentOffset, depth];
  }

  syncMark(parentRect: DOMRect) {
    for (const mark of this.marks) {
      const rect = mark.range.getBoundingClientRect();
      mark.mark.style.setProperty('--width', rect.width + 'px');
      mark.mark.style.setProperty('--height', rect.height + 'px');
      mark.mark.style.setProperty('--left', (rect.x - parentRect.x) + 'px');
      mark.mark.style.setProperty('--top', (rect.y - parentRect.y) + 'px');
    }
  }

  close(): void {
    this.dropdown.style.display = 'none';
    this.dropdown.remove();
  }

  open(range: Range): void {
    for (const markedRange of this.marks) {
      if (markedRange.range.compareBoundaryPoints(Range.END_TO_END, range) >= 0 &&
        markedRange.range.compareBoundaryPoints(Range.START_TO_START, range) < 0) {
        this.dropdown.style.display = 'block';
        const rangeRect = markedRange.range.getBoundingClientRect();
        this.dropdown.style.left = (rangeRect.x + rangeRect.width / 2) + 'px';
        this.dropdown.style.top = rangeRect.y + 'px';
        this.tooltipContainer.appendChild(this.dropdown);
        this.dropdown.style.transform = 'translateY(-' + this.dropdown.getBoundingClientRect().height + 'px)';
        return;
      }
    }
  }

  remove() {
    for (const mark of this.marks) {
      mark.mark.remove();
    }
    this.marks.length = 0;
    this.dropdown.remove();
  }

  setSuggestions(result: LanguagetoolResult, index: number, removeMark: () => void): void {
    this.dropdown = document.createElement('div');
    this.dropdown.classList.add('dropdownBlock');
    const suggestions = result.matches[index].replacements;
    if (!suggestions.length) {
      const dropdownElem = document.createElement('span');
      dropdownElem.classList.add('error-message');
      dropdownElem.append(result.matches[index].message);
      this.dropdown.append(dropdownElem);
    } else {
      const length = suggestions.length > 3 ? 3 : suggestions.length;
      for (let j = 0; j < length; j++) {
        const dropdownElem = document.createElement('span');
        dropdownElem.classList.add('suggestions');
        dropdownElem.innerText = suggestions[j].value;
        this.dropdown.append(dropdownElem);
        dropdownElem.addEventListener('click', () => {
          if (document.queryCommandSupported('insertText')) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(this.textRange);
            document.execCommand('insertText', false, suggestions[j].value);
          } else {
            this.textRange.deleteContents();
            this.textRange.insertNode(document.createTextNode(suggestions[j].value));
          }
          removeMark();
        });
      }
    }
  }

  private createMarkedRange(range: Range): MarkedRange {
    const rect = range.getBoundingClientRect();
    const parentRect = this.markContainer.getBoundingClientRect();
    const elem = document.createElement('span');
    elem.style.setProperty('--width', rect.width + 'px');
    elem.style.setProperty('--height', rect.height + 'px');
    elem.style.setProperty('--left', (rect.x - parentRect.x) + 'px');
    elem.style.setProperty('--top', (rect.y - parentRect.y) + 'px');
    this.markContainer.append(elem);
    return {
      mark: elem,
      range
    };
  }

}
