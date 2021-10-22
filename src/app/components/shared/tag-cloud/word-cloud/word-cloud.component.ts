import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
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

  @ViewChild('wordCloud') wordCloud: ElementRef<HTMLDivElement>;
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

  private static getIndexForSortedArray<K>(array: K[], value: number, valueMapper: (x: K) => number) {
    let low = 0;
    let high = array.length;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (valueMapper(array[mid]) >= value) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    return low;
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
    //TODO: this.fontInfoService.waitTillFontLoaded('Dancing Script').subscribe(font => console.log(font));
    const [min, max] = this.calculateChanges(this.keywords);
    const isSame = Math.abs(max - min) <= Number.EPSILON;
    let defaultWeightClass;
    if (this.weightClassType === WeightClassType.lowest) {
      defaultWeightClass = 0;
    } else if (this.weightClassType === WeightClassType.highest) {
      defaultWeightClass = this.weightClasses - 1;
    } else {
      defaultWeightClass = Math.round(this.weightClasses / 2);
    }
    const parentElement = this.wordCloud.nativeElement;
    const parentRect = parentElement.getBoundingClientRect();
    const parentWidth = parentRect.width / 2;
    const parentHeight = parentRect.height / 2;
    this._elements = this._elements.filter((word, i) => {
      const weightClass = isSame ?
          defaultWeightClass :
          Math.round((max - word.meta.weight) * (this.weightClasses - 1) / (max - min));
      word.element.classList.value = 'weight-class-' + weightClass;
      word.weightClass = weightClass;
      if (this.findPlaceInCloud(i, parentWidth, parentHeight)) {
        return true;
      }
      word.element.remove();
      return false;
    });
    const timeInMs = 500;
    parentElement.style.setProperty('--fadeInTime', timeInMs + 'ms');
    this._elements.forEach(e => {
      const [x, y] = e.buildInformation.position;
      e.element.style.setProperty('--pos-x', (x + parentWidth) + 'px');
      e.element.style.setProperty('--pos-y', (y + parentHeight) + 'px');
    });
    const newElements = this._elements.filter(e => e.element.style.opacity !== '1');
    let index = 0;
    const intervalId = setInterval(() => {
      if (index >= newElements.length) {
        clearInterval(intervalId);
        return;
      }
      newElements[index++].element.style.opacity = '1';
    }, timeInMs);
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
      const elem = this.renderer2.createElement('span');
      elem.innerText = dataEntry.text;
      elem.dataset.index = index;
      this.wordCloud.nativeElement.appendChild(elem);
      const rect = elem.getBoundingClientRect() as DOMRect;
      newElements.push({
        element: elem,
        meta: dataEntry,
        weightClass: null,
        buildInformation: {
          position: [0, 0, rect.width, rect.height],
          hasNeighbour: [false, false, false, false]
        }
      });
    }
    return [min, max, obsoleteElements, newElements];
  }

  private calculateChanges(data: T[]): [min: number, max: number] {
    const [min, max, obsoleteElements, newElements] = this.calculateObsoleteAndNewElements(data);
    this._elements = this._elements.filter((word, index) => {
      if (obsoleteElements.length && index === obsoleteElements[0].index) {
        word.element.remove();
        obsoleteElements.shift();
        return false;
      }
      word.buildInformation.hasNeighbour.fill(false);
      return true;
    });
    newElements.forEach(e => this._elements.splice(
        WordCloudComponent.getIndexForSortedArray(this._elements, e.meta.weight, x => x.meta.weight), 0, e));
    return [min, max];
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

}
