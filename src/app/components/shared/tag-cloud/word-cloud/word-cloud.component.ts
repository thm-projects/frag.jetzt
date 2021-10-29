import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { FontInfoService } from '../../../../services/util/font-info.service';
import { CloudParameters, CloudTextStyle } from '../../../../utils/cloud-parameters';

export interface WordMeta {
  text: string;
  weight: number;
}

interface BuildInformation {
  position: [x: number, y: number, width: number, height: number];
  hasNeighbour: [top: boolean, bottom: boolean, right: boolean, left: boolean];
}

export interface ActiveWord<T extends WordMeta> {
  meta: T;
  weightClass: number;
  element: HTMLSpanElement;
  buildInformation: BuildInformation;
}

export enum WeightClassType {
  lowest,
  middle,
  highest
}

interface StyleDeclarations {
  root: number;
  weights: number[];
}

@Component({
  selector: 'app-word-cloud',
  templateUrl: './word-cloud.component.html',
  styleUrls: ['./word-cloud.component.scss']
})
export class WordCloudComponent<T extends WordMeta> implements OnInit, OnChanges, OnDestroy {

  @ViewChild('wordCloud', { static: true }) wordCloud: ElementRef<HTMLDivElement>;
  @Output() clicked = new EventEmitter<T>();
  @Output() entered = new EventEmitter<ActiveWord<T>>();
  @Output() left = new EventEmitter<ActiveWord<T>>();
  @Input() keywords: T[];
  @Input() weightClasses = 10;
  @Input() weightClassType = WeightClassType.lowest;
  @Input() parameters: CloudParameters = CloudParameters.currentParameters;
  private _elements: ActiveWord<T>[] = [];
  private _cssStyleElement: HTMLStyleElement;
  private _styleIndexes: StyleDeclarations;

  constructor(private renderer2: Renderer2,
              private fontInfoService: FontInfoService) {
  }

  private static invertHex(hexStr: string) {
    const r = 255 - parseInt(hexStr.substr(1, 2), 16);
    const g = 255 - parseInt(hexStr.substr(3, 2), 16);
    const b = 255 - parseInt(hexStr.substr(5, 2), 16);
    return `#${((r * 256 + g) * 256 + b).toString(16).padStart(6, '0')}`;
  }

  ngOnInit() {
    this._cssStyleElement = this.renderer2.createElement('style');
    this.renderer2.appendChild(document.head, this._cssStyleElement);
    const sheet = this._cssStyleElement.sheet;
    this._styleIndexes = {
      root: sheet.insertRule(':root {}', sheet.cssRules.length),
      weights: [],
    };
    sheet.insertRule('.spacyTagCloudContainer { background-color: var(--tag-cloud-background-color, unset); }',
      sheet.cssRules.length);
    sheet.insertRule('.header-icons { color: var(--tag-cloud-inverted-background) !important; }',
      sheet.cssRules.length);
    sheet.insertRule('.header .oldtypo-h2, .header .oldtypo-h2 + span { ' +
      'color: var(--tag-cloud-inverted-background) !important; }', sheet.cssRules.length);
    sheet.insertRule('#footer_rescale { display: none; }', sheet.cssRules.length);
    sheet.insertRule('div.main_container { background-color: var(--tag-cloud-background-color) !important; }',
      sheet.cssRules.length);
    this.updateStyles();
  }

  ngOnDestroy() {
    this._cssStyleElement.remove();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.keywords) {
      this.redraw();
    }
    if (changes.parameters) {
      this.updateParameters(changes.parameters.previousValue);
    }
  }

  updateParameters(previousValue: CloudParameters) {
    if (this.needsRedraw(previousValue)) {
      this.updateStyles();
      this.redraw();
    } else if (this.needsStyleUpdate(previousValue)) {
      this.updateStyles();
    }
  }

  needsRedraw(previous: CloudParameters): boolean {
    if (previous === null) {
      return true;
    }
    const current = this.parameters;
    return (previous.randomAngles !== current.randomAngles) ||
      (previous.sortAlphabetically !== current.sortAlphabetically) ||
      (previous.fontSizeMin !== current.fontSizeMin) ||
      (previous.fontSizeMax !== current.fontSizeMax) ||
      (previous.textTransform !== current.textTransform) ||
      (previous.fontStyle !== current.fontStyle) ||
      (previous.fontWeight !== current.fontWeight) ||
      (previous.fontFamily !== current.fontFamily) ||
      (previous.fontSize !== current.fontSize) ||
      previous.cloudWeightSettings.some((setting, i) => {
        const currentSetting = current.cloudWeightSettings[i];
        return (setting.maxVisibleElements !== currentSetting.maxVisibleElements) ||
          (setting.rotation !== currentSetting.rotation);
      });
  }

  needsStyleUpdate(previous: CloudParameters): boolean {
    const current = this.parameters;
    return (previous.backgroundColor !== current.backgroundColor) ||
      (previous.fontColor !== current.fontColor) ||
      previous.cloudWeightSettings.some((setting, i) =>
        setting.color !== current.cloudWeightSettings[i].color);
  }

  updateStyles() {
    /* eslint-disable @typescript-eslint/naming-convention */
    const transform = this.parameters.textTransform || CloudTextStyle.normal;
    const sheet = this._cssStyleElement.sheet;
    const { root, weights } = this._styleIndexes;
    const invertedBackground = WordCloudComponent.invertHex(this.parameters.backgroundColor);
    this.transformObjectToCSS(sheet, root, {
      TagCloudFontColor: this.parameters.fontColor,
      TagCloudBackgroundColor: this.parameters.backgroundColor,
      TagCloudInvertedBackground: invertedBackground,
      TagCloudTransform: transform,
      TagCloudFontFamily: this.parameters.fontFamily,
      TagCloudFontSize: this.parameters.fontSize,
      TagCloudFontWeight: this.parameters.fontWeight,
      TagCloudFontStyle: this.parameters.fontStyle,
    });
    for (let i = this._styleIndexes.weights.length; i < this.weightClasses; i++) {
      weights.push(sheet.insertRule('.word-cloud > .weight-class-' + i + ' {}', sheet.cssRules.length));
    }
    const fontRange = (this.parameters.fontSizeMax - this.parameters.fontSizeMin) / this.weightClasses;
    for (let i = 0; i < this.weightClasses; i++) {
      this.transformObjectToCSS(sheet, weights[i], {
        color: this.parameters.cloudWeightSettings[i].color,
        fontSize: (this.parameters.fontSizeMin + fontRange * i).toFixed(0) + '%'
      });
    }
    /* eslint-enable @typescript-eslint/naming-convention */
  }

  transformObjectToCSS(sheet: CSSStyleSheet, index: number, object: any) {
    const upper = /[A-Z]/gm;
    const replacer = (x: string, ...args: any) => (args[1] === 0 ? '--' : '-') + x.toLowerCase();
    let str = '{';
    for (const key of Object.keys(object)) {
      str += `\n${key.replace(upper, replacer)}: ${object[key]};`;
    }
    str = str + (str.length > 1 ? '\n}' : '}');
    const text = sheet.cssRules[index].cssText;
    sheet.deleteRule(index);
    sheet.insertRule(text.substr(0, text.indexOf('{')) + str);
  }

  redraw() {
    if (!this.wordCloud || !this.wordCloud.nativeElement) {
      return;
    }
    this.calculateChanges(this.keywords);
    const parentElement = this.wordCloud.nativeElement;
    const parentRect = parentElement.getBoundingClientRect();
    const parentWidth = parentRect.width / 2;
    const parentHeight = parentRect.height / 2;
    if (this.parameters.sortAlphabetically) {
      this.redrawGrid(parentWidth, parentHeight);
    } else {
      this.redrawCloud(parentWidth, parentHeight);
    }
    if (this._elements.length === 0) {
      return;
    }
    this.fontInfoService.waitTillFontLoaded(this.parameters.fontFamily).subscribe(_ => {
      this.doDraw(parentElement, parentWidth, parentHeight);
    });
  }

  onMouseEvent(event: MouseEvent) {
    const parent = this.wordCloud && this.wordCloud.nativeElement;
    const elem = event.target as HTMLSpanElement;
    if (!parent || elem === parent || !parent.contains(elem)) {
      return;
    }
    const activeWord = this._elements[+elem.dataset.index];
    if (event.type === 'click') {
      this.clicked.emit(activeWord.meta);
      return;
    }
    if (event.type === 'mouseover') {
      this.entered.emit(activeWord);
      return;
    }
    this.left.emit(activeWord);
  }

  private redrawGrid(parentWidth: number, parentHeight: number) {
    const fullwidth = parentWidth * 2;
    let lines = 1;
    let counter = 0;
    const drawIndices = [];
    let heightAcc = 0;
    let maxHeight = 0;
    for (let i = 0, lastIndex = 0; i < this._elements.length; i++) {
      const word = this._elements[i];
      const rect = word.element.getBoundingClientRect() as DOMRect;
      word.buildInformation.position[2] = rect.width;
      word.buildInformation.position[3] = rect.height;
      maxHeight = Math.max(maxHeight, rect.height);
      if (i > lastIndex && counter + rect.width > fullwidth) {
        lastIndex = i;
        ++lines;
        heightAcc += maxHeight;
        drawIndices.push([i, counter, maxHeight]);
        maxHeight = 0;
        counter = rect.width;
      } else {
        counter += rect.width;
      }
    }
    drawIndices.push([this._elements.length, counter, maxHeight]);
    const fullheight = parentHeight * 2;
    const ySpace = (fullheight - heightAcc) / (lines + 1);
    let lastElemIndex = drawIndices[0][0];
    let xSpace = (fullwidth - drawIndices[0][1]) / (lastElemIndex + 1);
    let xOffset = xSpace;
    for (let i = 0, yOffset = ySpace; i < this._elements.length; i++, xOffset += xSpace) {
      if (i === lastElemIndex) {
        drawIndices.shift();
        xSpace = (fullwidth - drawIndices[0][1]) / (drawIndices[0][0] - lastElemIndex + 1);
        xOffset = xSpace;
        lastElemIndex = drawIndices[0][0];
        yOffset += ySpace;
      }
      const info = this._elements[i].buildInformation;
      info.position[0] = -parentWidth + xOffset;
      xOffset += info.position[2];
      info.position[1] = -parentHeight + yOffset + info.position[3] / 2;
    }
  }

  private redrawCloud(parentWidth: number, parentHeight: number) {
    const toDelete = [];
    this._elements = this._elements.filter((word, i) => {
      const rect = word.element.getBoundingClientRect() as DOMRect;
      word.buildInformation.position[2] = rect.width;
      word.buildInformation.position[3] = rect.height;
      if (this.findPlaceInCloud(i, parentWidth, parentHeight)) {
        return true;
      }
      toDelete.push(word.element);
      return false;
    });
    for (const elem of toDelete) {
      elem.remove();
    }
  }

  private calculateObsoleteAndNewElements(data: T[]): [
    min: number, max: number, obsolete: { word: ActiveWord<T>; index: number }[], newElements: ActiveWord<T>[]
  ] {
    let min = null;
    let max = null;
    let first = true;
    const obsoleteElements = this._elements.map((word, index) => ({ word, index }));
    const newElements: ActiveWord<T>[] = [];
    for (const dataEntry of data) {
      if (!first) {
        min = Math.min(min, dataEntry.weight);
        max = Math.max(max, dataEntry.weight);
      } else {
        first = false;
        min = max = dataEntry.weight;
      }
      let fallback = null;
      const index = obsoleteElements.findIndex((buildElem, wordIndex) => {
        if (buildElem.word.meta === dataEntry) {
          return true;
        } else if (buildElem.word.meta.text === dataEntry.text) {
          const dist = Math.abs(buildElem.word.meta.weight - dataEntry.weight);
          if (!fallback || dist < fallback[1]) {
            fallback = [wordIndex, dist];
          }
        }
      });
      if (index >= 0) {
        obsoleteElements.splice(index, 1);
        continue;
      } else if (fallback) {
        obsoleteElements.splice(fallback[0], 1)[0].word.meta = dataEntry;
        continue;
      }
      newElements.push({
        element: null,
        meta: dataEntry,
        weightClass: null,
        buildInformation: {
          position: [0, 0, 0, 0],
          hasNeighbour: [false, false, false, false],
        },
      });
    }
    return [min, max, obsoleteElements, newElements];
  }

  private calculateChanges(data: T[]) {
    const [min, max, obsoleteElements, newElements] = this.calculateObsoleteAndNewElements(data);
    const toDeleteElement = [];
    const isSame = Math.abs(max - min) <= Number.EPSILON;
    let defaultWeightClass;
    if (this.weightClassType === WeightClassType.lowest) {
      defaultWeightClass = 0;
    } else if (this.weightClassType === WeightClassType.highest) {
      defaultWeightClass = this.weightClasses - 1;
    } else {
      defaultWeightClass = Math.round(this.weightClasses / 2);
    }
    this._elements = this._elements.filter((word, index) => {
      if (obsoleteElements.length && index === obsoleteElements[0].index) {
        toDeleteElement.push(word.element);
        obsoleteElements.shift();
        return false;
      }
      const weightClass = isSame ?
        defaultWeightClass :
        Math.round((word.meta.weight - min) * (this.weightClasses - 1) / (max - min));
      word.element.classList.value = 'weight-class-' + weightClass;
      word.weightClass = weightClass;
      word.buildInformation.hasNeighbour.fill(false);
      return true;
    });
    newElements.forEach((word) => {
      word.element = toDeleteElement.pop();
      if (!word.element) {
        word.element = this.renderer2.createElement('span');
        this.wordCloud.nativeElement.appendChild(word.element);
      }
      word.element.innerText = word.meta.text;
      const weightClass = isSame ?
        defaultWeightClass :
        Math.round((word.meta.weight - min) * (this.weightClasses - 1) / (max - min));
      word.element.classList.value = 'weight-class-' + weightClass;
      word.weightClass = weightClass;
    });
    this._elements.push(...newElements);
    if (this.parameters.sortAlphabetically) {
      this._elements.sort((a, b) => a.meta.text.localeCompare(b.meta.text, undefined, { sensitivity: 'base' }));
    } else {
      this._elements.sort((a, b) => b.meta.weight - a.meta.weight);
    }
    for (const elem of toDeleteElement) {
      elem.remove();
    }
  }

  private findPlaceInCloud(index: number, parentWidth: number, parentHeight: number): boolean {
    const [_, __, elemWidth, elemHeight] = this._elements[index].buildInformation.position;
    const elemWidthHalf = elemWidth / 2;
    const elemHeightHalf = elemHeight / 2;
    if (index === 0) {
      this._elements[0].buildInformation.position = [-elemWidthHalf, -elemHeightHalf, elemWidth, elemHeight];
      return true;
    }
    let bestPos = [0, 0];
    let bestDistSquared = null;
    let currentIndex = null;
    const aspectSquared = Math.pow(parentHeight / parentWidth, 2);
    const checkBetter = (x: number, y: number, hasNeighbour: boolean[], dir: number, elemIndex: number) => {
      if (!hasNeighbour[dir] && !this.isColliding(x, y, elemWidth, elemHeight, index, parentWidth, parentHeight)) {
        const newMid = [x + elemWidthHalf, y + elemHeightHalf];
        const size = newMid[0] * newMid[0] * aspectSquared + newMid[1] * newMid[1];
        if (!bestDistSquared || size < bestDistSquared) {
          bestPos = newMid;
          bestDistSquared = size;
          currentIndex = [elemIndex, 0];
        }
      }
    };
    for (let i = 0; i < index; ++i) {
      const { hasNeighbour, position } = this._elements[i].buildInformation;
      const [x, y, width, height] = position;
      const midX = x + width / 2;
      const midY = y + height / 2;
      //top
      let newX = midX - elemWidthHalf;
      let newY = y - elemHeight;
      checkBetter(newX, newY, hasNeighbour, 0, i);
      //bottom
      newY = y + height;
      checkBetter(newX, newY, hasNeighbour, 1, i);
      //right
      newX = x + width;
      newY = midY - elemHeightHalf;
      checkBetter(newX, newY, hasNeighbour, 2, i);
      //left
      newX = x - elemWidth;
      checkBetter(newX, newY, hasNeighbour, 3, i);
    }
    if (bestDistSquared === null) {
      return false;
    }
    this._elements[index].buildInformation.position = [
      bestPos[0] - elemWidthHalf, bestPos[1] - elemHeightHalf, elemWidth, elemHeight
    ];
    this._elements[currentIndex[0]].buildInformation.hasNeighbour[currentIndex[1]] = true;
    return true;
  }

  private isColliding(x: number, y: number, width: number, height: number, endIndex: number,
                      parentWidth: number, parentHeight: number): boolean {
    const endX = x + width;
    const endY = y + height;
    if (x < -parentWidth || endX > parentWidth || y < -parentHeight || endY > parentHeight) {
      return true;
    }
    for (let i = 0; i < endIndex; ++i) {
      const [elemX, elemY, elemWidth, elemHeight] = this._elements[i].buildInformation.position;
      if (elemX < endX && elemX + elemWidth > x && elemY < endY && elemY + elemHeight > y) {
        return true;
      }
    }
    return false;
  }

  private doDraw(parentElement: HTMLDivElement, parentWidth: number, parentHeight: number) {
    const timeInMs = 500;
    const interval = this.parameters.delayWord;
    parentElement.style.setProperty('--fadeInTime', timeInMs + 'ms');
    this._elements.forEach((e, i) => {
      const [x, y] = e.buildInformation.position;
      e.element.style.setProperty('--pos-x', (x + parentWidth) + 'px');
      e.element.style.setProperty('--pos-y', (y + parentHeight) + 'px');
      e.element.dataset.index = String(i);
    });
    const newElements = this._elements.filter(e => e.element.style.opacity !== '1');
    let index = 0;
    const intervalId = setInterval(() => {
      if (index >= newElements.length) {
        clearInterval(intervalId);
        return;
      }
      newElements[index++].element.style.opacity = '1';
    }, interval);
  }

}
