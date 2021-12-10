import { LanguagetoolResult } from '../../../services/http/languagetool.service';
import { QuillEditorComponent } from 'ngx-quill';
import { mark } from '@angular/compiler-cli/src/ngtsc/perf/src/clock';

class ContentIndexFinder {

  private opIndex = 0;
  private contentOffset = 0;
  private textOffset = 0;

  constructor(private contentOps) {
  }

  adjustTextIndexes(startIndex: number, length: number): [number, number] {
    const endIndex = startIndex + length;
    let textLen = typeof this.contentOps[this.opIndex]['insert'] === 'string' ?
      this.contentOps[this.opIndex]['insert'].length : 0;
    while (textLen === 0 || this.textOffset + textLen < startIndex) {
      this.textOffset += textLen;
      this.contentOffset += textLen === 0 ? 1 : textLen;
      ++this.opIndex;
      textLen = typeof this.contentOps[this.opIndex]['insert'] === 'string' ?
        this.contentOps[this.opIndex]['insert'].length : 0;
    }
    const diff = this.contentOffset - this.textOffset;
    startIndex += diff;
    while (this.textOffset + textLen < endIndex) {
      this.textOffset += textLen;
      this.contentOffset += textLen === 0 ? 1 : textLen;
      ++this.opIndex;
      textLen = typeof this.contentOps[this.opIndex]['insert'] === 'string' ?
        this.contentOps[this.opIndex]['insert'].length : 0;
    }
    length += this.contentOffset - this.textOffset - diff;
    return [startIndex, length];
  }
}

export class Marks {

  private textErrors: Mark[] = [];

  constructor(private markContainer: HTMLDivElement,
              private tooltipContainer: HTMLDivElement,
              private editor: QuillEditorComponent) {
  }

  clear() {
    for (const textError of this.textErrors) {
      textError.remove();
    }
    this.textErrors.length = 0;
  }

  onClick(index: number) {
    const editorRect = this.editor.editorElem.firstElementChild.getBoundingClientRect();
    for (const textError of this.textErrors) {
      textError.close();
      if (index !== null) {
        textError.open(index, editorRect.y, editorRect.x);
      }
    }
  }

  onDataChange(delta): void {
    let index = 0;
    for (const op of delta.ops) {
      if (op['insert']) {
        const len = typeof op['insert'] === 'string' ? op['insert'].length : 1;
        for (const textError of this.textErrors) {
          if (index > textError.startIndex + textError.markLength) {
            continue;
          }
          if (index >= textError.startIndex) {
            textError.markLength += len;
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
          if (index >= textError.startIndex + textError.markLength) {
            return true;
          }
          if (index > textError.startIndex) {
            if (endDelete < textError.startIndex + textError.markLength) {
              textError.markLength -= len;
              return true;
            }
            textError.markLength = index - textError.startIndex;
            return true;
          }
          if (endDelete < textError.startIndex) {
            textError.startIndex -= len;
            return true;
          }
          if (endDelete < textError.startIndex + textError.markLength) {
            const errLen = textError.startIndex + textError.markLength - endDelete;
            textError.startIndex = index;
            textError.markLength = errLen;
            return true;
          }
          textError.remove();
          return false;
        });
      } else {
        console.log(op);
      }
    }
    this.sync();
  }

  buildErrors(initialText: string, res: LanguagetoolResult): void {
    this.onClick(null);
    this.clear();
    const indexFinder = new ContentIndexFinder(this.editor.quillEditor.getContents().ops);
    for (const match of res.matches) {
      const [start, len] = indexFinder.adjustTextIndexes(match.offset, match.length);
      this.createMark(start, len, match);
    }
    this.sync();
  }

  sync(): void {
    const parentRect = this.markContainer.getBoundingClientRect();
    const editorRect = this.editor.editorElem.firstElementChild.getBoundingClientRect();
    for (const error of this.textErrors) {
      error.syncMark(parentRect, editorRect.y - parentRect.y);
    }
  }

  copy(marks: Marks) {
    this.onClick(null);
    this.clear();
    for (const oldMark of marks.textErrors) {
      this.createMark(oldMark.startIndex, oldMark.markLength, oldMark);
    }
    this.sync();
  }

  private createMark(start: number, len: number, dataObject: any) {
    const newMark = new Mark(start, len, this.markContainer, this.tooltipContainer, this.editor.quillEditor);
    newMark.setSuggestions(dataObject.replacements, dataObject.message, () => {
      const index = this.textErrors.findIndex(elem => elem === newMark);
      if (index >= 0) {
        this.textErrors.splice(index, 1);
      }
      newMark.remove();
    });
    this.textErrors.push(newMark);
  }
}

class Mark {

  public replacements: { value?: string }[];
  public message: string;
  private marks: HTMLSpanElement[] = [];
  private dropdown: HTMLDivElement;

  constructor(public startIndex,
              public markLength,
              private markContainer: HTMLDivElement,
              private tooltipContainer: HTMLDivElement,
              private quillEditor: any) {
  }

  syncMark(parentRect: DOMRect, offset: number) {
    const boundaries = this.calculateBoundaries();
    for (let i = this.marks.length; i < boundaries.length; i++) {
      const elem = document.createElement('span');
      this.markContainer.appendChild(elem);
      this.marks.push(elem);
    }
    for (let i = this.marks.length - 1; i >= boundaries.length; i--) {
      this.marks[i].remove();
    }
    this.marks.length = boundaries.length;
    for (let i = 0; i < this.marks.length; i++) {
      const current = this.marks[i];
      const rect = this.quillEditor.getBounds(boundaries[i][0], boundaries[i][1]);
      current.style.setProperty('--width', rect.width + 'px');
      current.style.setProperty('--height', rect.height + 'px');
      current.style.setProperty('--left', rect.left + 'px');
      current.style.setProperty('--top', (rect.top + offset) + 'px');
    }
  }

  close(): void {
    this.dropdown.style.display = 'none';
    this.dropdown.remove();
  }

  open(index: number, editorOffsetTop: number, editorOffsetLeft: number): void {
    if (index < this.startIndex || index >= this.startIndex + this.markLength) {
      return;
    }
    const boundaries = this.calculateBoundaries();
    const i = boundaries.findIndex(value => index >= value[0] && index < value[0] + value[1]);
    this.dropdown.style.display = 'block';
    if (i >= 0) {
      const rangeRect = this.marks[i].getBoundingClientRect();
      this.dropdown.style.left = (rangeRect.x + rangeRect.width / 2) + 'px';
      this.dropdown.style.top = rangeRect.y + 'px';
    } else {
      const bounds = this.quillEditor.getBounds(index);
      this.dropdown.style.left = (bounds.left + editorOffsetLeft) + 'px';
      this.dropdown.style.top = (bounds.top + editorOffsetTop) + 'px';
    }
    this.tooltipContainer.appendChild(this.dropdown);
    this.dropdown.style.transform = 'translateY(-' + this.dropdown.getBoundingClientRect().height + 'px)';
  }

  remove() {
    for (const current of this.marks) {
      current.remove();
    }
    this.marks.length = 0;
    this.dropdown.remove();
  }

  setSuggestions(replacements: { value?: string }[], message: string, removeMark: () => void): void {
    this.replacements = replacements;
    this.message = message;
    this.dropdown = document.createElement('div');
    this.dropdown.classList.add('dropdownBlock');
    const suggestions = replacements;
    if (!suggestions.length) {
      const dropdownElem = document.createElement('span');
      dropdownElem.classList.add('error-message');
      dropdownElem.append(message);
      this.dropdown.append(dropdownElem);
    } else {
      const length = suggestions.length > 3 ? 3 : suggestions.length;
      for (let j = 0; j < length; j++) {
        const dropdownElem = document.createElement('span');
        dropdownElem.classList.add('suggestions');
        if (suggestions[j].value.trim().length < 1) {
          dropdownElem.innerHTML = '<em>\'' + suggestions[j].value + '\'</em>';
        } else {
          dropdownElem.innerText = suggestions[j].value;
        }
        this.dropdown.append(dropdownElem);
        dropdownElem.addEventListener('click', () => {
          this.quillEditor.deleteText(this.startIndex, this.markLength, 'user');
          this.quillEditor.insertText(this.startIndex, suggestions[j].value, 'user');
          removeMark();
        });
      }
    }
  }

  private calculateBoundaries(): [start: number, length: number][] {
    const ops = this.quillEditor.getContents(this.startIndex, this.markLength).ops;
    const bounds = [];
    let currentIndex = 0;
    for (const op of ops) {
      if (typeof op['insert'] === 'string') {
        const text = op['insert'];
        let i = text.indexOf('\n');
        let findIndex = 0;
        while (i >= 0) {
          if (i > findIndex) {
            bounds.push([this.startIndex + findIndex + currentIndex, i - findIndex]);
          }
          findIndex = i + 1;
          i = text.indexOf('\n', findIndex);
        }
        if (text.length + currentIndex < this.markLength) {
          if (text.length > findIndex) {
            bounds.push([this.startIndex + findIndex + currentIndex, text.length - findIndex]);
          }
        } else if (this.markLength > findIndex + currentIndex && text.length > findIndex) {
          bounds.push([this.startIndex + findIndex + currentIndex, this.markLength - findIndex - currentIndex]);
        }
        currentIndex += text.length;
      } else {
        ++currentIndex;
      }
    }
    return bounds;
  }

}
