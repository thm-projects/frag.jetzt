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
import { ColorContrast, ColorRGB } from '../../../../utils/color-contrast';
import { WordCloudDrawFunctions } from './word-cloud-draw-functions';

export interface WordMeta {
  text: string;
  weight: number;
  rotate: number;
}

type CloudDrawFuncType = [top: boolean, bottom: boolean, right: boolean, left: boolean];

interface PositionInformation {
  position: {
    width: number;
    height: number;
    rotation: number;
    horizontalLine: [mx: number, my: number, bx: number, by: number];
    verticalLine: [mx: number, my: number, bx: number, by: number];
  };
  origin: [x: number, y: number];
  additional?: CloudDrawFuncType | any;
}

export interface ActiveWord<T extends WordMeta> {
  meta: T;
  weightClass: number;
  element: HTMLSpanElement;
  buildInformation: PositionInformation;
}

export enum WeightClassType {
  Lowest,
  Middle,
  Highest
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
  @Input() weightClassType = WeightClassType.Lowest;
  @Input() parameters: CloudParameters = CloudParameters.currentParameters;
  private _elements: ActiveWord<T>[] = [];
  private _cssStyleElement: HTMLStyleElement;
  private _styleIndexes: StyleDeclarations;

  constructor(
    private renderer2: Renderer2,
    private fontInfoService: FontInfoService
  ) {
  }

  private static invertHex(hexStr: string) {
    const currentColor: ColorRGB = [
      parseInt(hexStr.substring(1, 3), 16),
      parseInt(hexStr.substring(3, 5), 16),
      parseInt(hexStr.substring(5, 7), 16)
    ];
    const [r, g, b] = ColorContrast.getInvertedColor(currentColor);
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
    const transform = this.parameters.textTransform || CloudTextStyle.Normal;
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
    sheet.insertRule(text.substring(0, text.indexOf('{')) + str, index);
  }

  redraw() {
    if (!this.wordCloud || !this.wordCloud.nativeElement) {
      return;
    }
    this.calculateChanges(this.keywords);
    if (this._elements.length === 0) {
      return;
    }
    const parentElement = this.wordCloud.nativeElement;
    const parentRect = parentElement.getBoundingClientRect();
    const parentWidth = parentRect.width / 2;
    const parentHeight = parentRect.height / 2;
    if (this.parameters.sortAlphabetically) {
      WordCloudDrawFunctions.calculateGridStructure(this._elements, parentWidth, parentHeight);
    } else {
      this.redrawCloud(parentWidth, parentHeight);
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

  private redrawCloud(parentWidth: number, parentHeight: number) {
    const toDelete = [];
    this._elements = this._elements.filter((word, i) => {
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

  private isAlreadyCreated(obsoleteElements: { word: ActiveWord<T>; index: number }[], dataEntry: T) {
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
      // Element is present and doesn't need to be removed
      obsoleteElements.splice(index, 1);
      return true;
    } else if (fallback) {
      // Element with nearly same attributes was found, use this instead
      obsoleteElements.splice(fallback[0], 1)[0].word.meta = dataEntry;
      return true;
    }
    return false;
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
      if (this.isAlreadyCreated(obsoleteElements, dataEntry)) {
        continue;
      }
      newElements.push({
        element: null,
        meta: dataEntry,
        weightClass: null,
        buildInformation: {
          position: null,
          origin: null,
        },
      });
    }
    return [min, max, obsoleteElements, newElements];
  }

  private calculateDeleted(
    obsoleteElements: { word: ActiveWord<T>; index: number }[]
  ) {
    const toDeleteElement = [] as HTMLSpanElement[];
    this._elements = this._elements.filter((word, index) => {
      if (index === obsoleteElements[0]?.index) {
        toDeleteElement.push(word.element);
        obsoleteElements.shift();
        return false;
      }
      return true;
    });
    return toDeleteElement;
  }

  private addNewElements(newElements: ActiveWord<T>[], toDeleteElement: HTMLSpanElement[]) {
    newElements.forEach((word) => {
      word.element = toDeleteElement.pop();
      if (!word.element) {
        word.element = this.renderer2.createElement('span');
        this.wordCloud.nativeElement.appendChild(word.element);
      }
      word.element.innerText = word.meta.text;
    });
    this._elements.push(...newElements);
  }

  private updateBuildInformation(
    isSame: boolean,
    max: number,
    min: number,
    defaultWeightClass: number,
  ) {
    this._elements.forEach((word) => {
      const weightClass = isSame ?
        defaultWeightClass :
        Math.round((word.meta.weight - min) * (this.weightClasses - 1) / (max - min));
      const newClass = 'weight-class-' + weightClass;
      const regex = /(^|\s)weight-class-\d+(?=$|\s)/g;
      const matches = word.element.classList.value.match(regex);
      if (!matches) {
        word.element.classList.add(newClass);
      } else if (matches.length > 1 || matches[0] !== newClass) {
        word.element.classList.replace(matches[0], newClass);
        word.element.classList.remove(...matches.slice(1));
      }
      word.weightClass = weightClass;
      word.element.style.setProperty('--rot', word.meta.rotate + 'deg');
    });
    this._elements.forEach((word) => {
      const computedElem = getComputedStyle(word.element);
      const width = parseFloat(computedElem.width) + parseFloat(computedElem.paddingLeft) + parseFloat(computedElem.paddingRight);
      const height = parseFloat(computedElem.height) + parseFloat(computedElem.paddingTop) + parseFloat(computedElem.paddingBottom);
      const cos = Math.cos(word.meta.rotate);
      const sin = Math.sin(word.meta.rotate);
      const halfW = width / 2;
      const halfH = height / 2;
      word.buildInformation.position = {
        width,
        height,
        rotation: word.meta.rotate,
        horizontalLine: [
          cos * width,
          sin * width,
          -halfW * cos + halfH * sin,
          -halfW * sin - halfH * cos,
        ],
        verticalLine: [
          -sin * height,
          cos * height,
          halfW * cos + halfH * sin,
          halfW * sin - halfH * cos,
        ]
      };
    });
  }

  private calculateChanges(data: T[]) {
    const [min, max, obsoleteElements, newElements] = this.calculateObsoleteAndNewElements([...data, ...new Array(4000).fill(0).map(e => ({
      text: Math.random().toString(16).substring(2, 6),
      rotate: 0,
      weight: 0,
    }) as T)]);
    const isSame = Math.abs(max - min) <= Number.EPSILON;
    let defaultWeightClass;
    if (this.weightClassType === WeightClassType.Lowest) {
      defaultWeightClass = 0;
    } else if (this.weightClassType === WeightClassType.Highest) {
      defaultWeightClass = this.weightClasses - 1;
    } else {
      defaultWeightClass = Math.round(this.weightClasses / 2);
    }
    const toDeleteElement = this.calculateDeleted(obsoleteElements);
    this.addNewElements(newElements, toDeleteElement);
    this.updateBuildInformation(isSame, max, min, defaultWeightClass);
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
    const { width: elemWidth, height: elemHeight } = this._elements[index].buildInformation.position;
    this._elements[index].buildInformation.additional = new Array(4).fill(false);
    const elemWidthHalf = elemWidth / 2;
    const elemHeightHalf = elemHeight / 2;
    if (index === 0) {
      this._elements[0].buildInformation.origin = [-elemWidthHalf, -elemHeightHalf];
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
      const { additional, position, origin } = this._elements[i].buildInformation;
      if (!origin) {
        continue;
      }
      const { width, height } = position;
      const [x, y] = origin;
      const midX = x + width / 2;
      const midY = y + height / 2;
      //top
      let newX = midX - elemWidthHalf;
      let newY = y - elemHeight;
      checkBetter(newX, newY, additional, 0, i);
      //bottom
      newY = y + height;
      checkBetter(newX, newY, additional, 1, i);
      //right
      newX = x + width;
      newY = midY - elemHeightHalf;
      checkBetter(newX, newY, additional, 2, i);
      //left
      newX = x - elemWidth;
      checkBetter(newX, newY, additional, 3, i);
    }
    if (bestDistSquared === null) {
      return false;
    }
    this._elements[index].buildInformation.origin = [bestPos[0] - elemWidthHalf, bestPos[1] - elemHeightHalf];
    this._elements[currentIndex[0]].buildInformation.additional[currentIndex[1]] = true;
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
      const origin = this._elements[i].buildInformation.origin;
      if (!origin) {
        continue;
      }
      const [elemX, elemY] = origin;
      const { width: elemWidth, height: elemHeight } = this._elements[i].buildInformation.position;
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
      const [x, y] = e.buildInformation.origin;
      e.element.style.setProperty('--pos-x', (x + parentWidth) + 'px');
      e.element.style.setProperty('--pos-y', (y + parentHeight) + 'px');
      e.element.dataset.index = String(i);
    });
    const newElements = this._elements.filter(e => !e.element.classList.contains('visible'));
    let index = 0;
    const intervalId = setInterval(() => {
      if (index >= newElements.length) {
        clearInterval(intervalId);
        return;
      }
      newElements[index++].element.classList.add('visible');
    }, interval);
  }

}