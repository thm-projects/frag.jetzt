import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild,
  computed,
} from '@angular/core';
import { FontInfoService } from '../../../services/util/font-info.service';
import {
  CloudParameters,
  CloudTextStyle,
} from '../../../utils/cloud-parameters';
import { ColorContrast } from '../../../utils/color-contrast';
import {
  CloudDrawFuncType,
  WordCloudDrawFunctions,
} from './word-cloud-draw-functions';
import { actualTheme } from 'app/base/theme/theme';

export interface WordMeta {
  text: string;
  weight: number;
  rotate: number;
}

interface PositionInformation<K = unknown> {
  position: {
    width: number;
    height: number;
    rotation: number;
    normalizedHorizontalLine: [mx: number, my: number];
    offsetHorizontalLine: [bx: number, by: number];
    normalizedVerticalLine: [mx: number, my: number];
    offsetVerticalLine: [bx: number, by: number];
  };
  origin: [x: number, y: number];
  additional?: K;
}

export interface ActiveWord<T extends WordMeta, K = unknown> {
  meta: T;
  weightClass: number;
  visible: boolean;
  element: HTMLSpanElement;
  buildInformation: PositionInformation<K>;
}

export enum WeightClassType {
  Lowest,
  Middle,
  Highest,
}

interface StyleDeclarations {
  root: number;
  weights: number[];
}

const TO_RAD = (2 * Math.PI) / 360;

@Component({
  selector: 'app-word-cloud',
  templateUrl: './word-cloud.component.html',
  styleUrls: ['./word-cloud.component.scss'],
  standalone: false,
})
export class WordCloudComponent<T extends WordMeta>
  implements OnChanges, OnDestroy {
  @ViewChild('wordCloud', { static: true })
  wordCloud: ElementRef<HTMLDivElement>;
  @Output() clicked = new EventEmitter<T>();
  @Output() entered = new EventEmitter<ActiveWord<T>>();
  @Output() left = new EventEmitter<ActiveWord<T>>();
  @Output() requested = new EventEmitter<T>();
  @Input() isRadar = false;
  @Input() keywords: T[];
  @Input() weightClasses = 10;
  @Input() weightClassType = WeightClassType.Lowest;
  @Input() parameters: CloudParameters = null;
  protected isDark = computed(() => actualTheme() === 'dark');
  private _elements: ActiveWord<T, CloudDrawFuncType<T>>[] = [];
  private _cssStyleElement: HTMLStyleElement;
  private _styleIndexes: StyleDeclarations;
  private _minHeight: number;

  constructor(
    private renderer2: Renderer2,
    private fontInfoService: FontInfoService,
  ) {}

  ngOnDestroy() {
    this._cssStyleElement?.remove();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['parameters']) {
      if (Object.keys(changes['parameters'].currentValue).length === 0) {
        return;
      }
      this.updateParameters(changes['parameters'].previousValue);
    }
    if (changes['keywords']) {
      this.redraw();
    }
  }

  updateParameters(previousValue: CloudParameters) {
    if (this._cssStyleElement === undefined) {
      this.initCSSElement();
    }
    if (this.needsRedraw(previousValue)) {
      this.updateStyles();
      this.redraw();
    } else if (this.needsStyleUpdate(previousValue)) {
      this.updateStyles();
    }
  }

  needsRedraw(previous: CloudParameters): boolean {
    if (previous === null || previous === undefined) {
      return true;
    }
    const current = this.parameters;
    return (
      previous.randomAngles !== current.randomAngles ||
      previous.sortAlphabetically !== current.sortAlphabetically ||
      previous.fontSizeMin !== current.fontSizeMin ||
      previous.fontSizeMax !== current.fontSizeMax ||
      previous.textTransform !== current.textTransform ||
      previous.fontStyle !== current.fontStyle ||
      previous.fontWeight !== current.fontWeight ||
      previous.fontFamily !== current.fontFamily ||
      previous.fontSize !== current.fontSize ||
      previous.cloudWeightSettings.some((setting, i) => {
        const currentSetting = current.cloudWeightSettings[i];
        return (
          setting.maxVisibleElements !== currentSetting.maxVisibleElements ||
          setting.rotation !== currentSetting.rotation
        );
      })
    );
  }

  needsStyleUpdate(previous: CloudParameters): boolean {
    const current = this.parameters;
    return (
      previous.backgroundColor !== current.backgroundColor ||
      previous.hoverTime !== current.hoverTime ||
      previous.hoverDelay !== current.hoverDelay ||
      previous.fontColor !== current.fontColor ||
      previous.cloudWeightSettings.some(
        (setting, i) => setting.color !== current.cloudWeightSettings[i].color,
      )
    );
  }

  updateStyles() {
    const transform = this.parameters.textTransform || CloudTextStyle.Normal;
    const sheet = this._cssStyleElement.sheet;
    const { root, weights } = this._styleIndexes;
    const color = ColorContrast.hexToRgb(this.parameters.backgroundColor);
    const inverted = ColorContrast.getInvertedColor(color);
    const invertedBackground = ColorContrast.rgbToHex(inverted);
    const hsl = ColorContrast.rgbToHsl(inverted);
    let grayscale = 1;
    if (hsl[1] > 0) {
      grayscale = 1 - hsl[1] * (1 - Math.abs(2 * hsl[2] - 1));
    }
    let rot = hsl[0] - 120;
    if (rot < 0) {
      rot += 360;
    }
    const invertedFont = ColorContrast.rgbToHex(
      ColorContrast.getInvertedColor(
        ColorContrast.hexToRgb(this.parameters.fontColor),
      ),
    );
    this.transformObjectToCSS(sheet, root, {
      WordCloudImage: `hue-rotate(${
        rot + 'deg'
      }) grayscale(${grayscale}) opacity(0.5)`,
      TagCloudFontColor: this.parameters.fontColor,
      TagCloudInvertedFontColor: invertedFont,
      TagCloudBackgroundColor: this.parameters.backgroundColor,
      TagCloudInvertedBackground: invertedBackground,
      TagCloudTransform: transform,
      TagCloudFontFamily: this.parameters.fontFamily,
      TagCloudFontSize: this.parameters.fontSize,
      TagCloudFontWeight: this.parameters.fontWeight,
      TagCloudFontStyle: this.parameters.fontStyle,
    });
    for (
      let i = this._styleIndexes.weights.length;
      i < this.weightClasses;
      i++
    ) {
      weights.push(
        sheet.insertRule(
          '.word-cloud > .weight-class-' + i + ' {}',
          sheet.cssRules.length,
        ),
      );
    }
    const fontRange =
      (this.parameters.fontSizeMax - this.parameters.fontSizeMin) /
      this.weightClasses;
    for (let i = 0; i < this.weightClasses; i++) {
      this.transformObjectToCSS(sheet, weights[i], {
        color: this.parameters.cloudWeightSettings[i].color,
        fontSize:
          (this.parameters.fontSizeMin + fontRange * i).toFixed(0) + '%',
      });
    }
    const parent = this.wordCloud.nativeElement;
    if (!parent) {
      return;
    }
    const hoverTime = this.parameters.hoverTime || 0;
    const hoverDelay = this.parameters.hoverDelay || 0;
    parent.style.setProperty('--hover-time', hoverTime + 's');
    parent.style.setProperty('--hover-delay', hoverDelay + 's');
  }

  transformObjectToCSS(sheet: CSSStyleSheet, index: number, object: object) {
    const upper = /[A-Z]/gm;
    const replacer = (x: string, ...args: unknown[]) =>
      (args[0] === 0 ? '--' : '-') + x.toLowerCase();
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
      WordCloudDrawFunctions.calculateGridStructure(
        this._elements,
        parentWidth,
        parentHeight,
      );
    } else {
      WordCloudDrawFunctions.calculateCloud(
        this._elements,
        parentWidth,
        parentHeight,
        this._minHeight,
      );
    }
    this.fontInfoService
      .waitTillFontLoaded(this.parameters.fontFamily)
      .subscribe(() => {
        this.doDraw(parentElement, parentWidth, parentHeight);
      });
  }

  requestEntry(index: number) {
    this.requested.emit(this._elements[index].meta);
  }

  onMouseEvent(event: MouseEvent) {
    const parent = this.wordCloud && this.wordCloud.nativeElement;
    const elem = event.target as HTMLSpanElement;
    if (!parent || elem === parent || !parent.contains(elem)) {
      return;
    }
    const activeWord = this._elements[+elem.dataset['index']];
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

  private isAlreadyCreated(
    obsoleteElements: { word: ActiveWord<T>; index: number }[],
    dataEntry: T,
  ) {
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
      return false;
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

  private calculateObsoleteAndNewElements(
    data: T[],
  ): [
    min: number,
    max: number,
    obsolete: { word: ActiveWord<T, CloudDrawFuncType<T>>; index: number }[],
    newElements: ActiveWord<T, CloudDrawFuncType<T>>[],
  ] {
    let min = null;
    let max = null;
    let first = true;
    const obsoleteElements = this._elements.map((word, index) => ({
      word,
      index,
    }));
    const newElements: ActiveWord<T, CloudDrawFuncType<T>>[] = [];
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
        visible: false,
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
    obsoleteElements: { word: ActiveWord<T>; index: number }[],
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

  private addNewElements(
    newElements: ActiveWord<T, CloudDrawFuncType<T>>[],
    toDeleteElement: HTMLSpanElement[],
  ) {
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
      const weightClass = isSame
        ? defaultWeightClass
        : Math.round(
            ((word.meta.weight - min) * (this.weightClasses - 1)) / (max - min),
          );
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
    this._minHeight = null;
    this._elements.forEach((word) => {
      const computedElem = getComputedStyle(word.element);
      const width =
        parseFloat(computedElem.width) +
        parseFloat(computedElem.paddingLeft) +
        parseFloat(computedElem.paddingRight);
      const height =
        parseFloat(computedElem.height) +
        parseFloat(computedElem.paddingTop) +
        parseFloat(computedElem.paddingBottom);
      this._minHeight =
        this._minHeight === null || this._minHeight > height
          ? height
          : this._minHeight;
      const rot = word.meta.rotate * TO_RAD;
      const cos = Math.cos(rot);
      const sin = Math.sin(rot);
      const halfW = width / 2;
      const halfH = height / 2;
      word.buildInformation.position = {
        width,
        height,
        rotation: word.meta.rotate,
        normalizedHorizontalLine: [cos, sin],
        offsetHorizontalLine: [
          -halfW * cos + halfH * sin,
          -halfW * sin - halfH * cos,
        ],
        normalizedVerticalLine: [-sin, cos],
        offsetVerticalLine: [
          halfW * cos + halfH * sin,
          halfW * sin - halfH * cos,
        ],
      };
    });
  }

  private calculateChanges(data: T[]) {
    const [min, max, obsoleteElements, newElements] =
      this.calculateObsoleteAndNewElements(data);
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
      this._elements.sort((a, b) =>
        a.meta.text.localeCompare(b.meta.text, undefined, {
          sensitivity: 'base',
        }),
      );
    } else {
      this._elements.sort((a, b) => b.meta.weight - a.meta.weight);
    }
    for (const elem of toDeleteElement) {
      elem.remove();
    }
  }

  private initCSSElement() {
    this._cssStyleElement = this.renderer2.createElement('style');
    this._cssStyleElement.id = 'tagCloudStyles';
    this.renderer2.appendChild(document.head, this._cssStyleElement);
    const sheet = this._cssStyleElement.sheet;
    this._styleIndexes = {
      root: sheet.insertRule(':root {}', sheet.cssRules.length),
      weights: [],
    };
    sheet.insertRule(
      '.spacyTagCloudContainer1, body, #rescale_screen {' +
        ' background-color: var(--tag-cloud-background-color, unset);' +
        ' }',
      sheet.cssRules.length,
    );
    sheet.insertRule(
      '.header-content-container > div > mat-icon {' +
        ' margin-top: 0 !important;' +
        ' }',
      sheet.cssRules.length,
    );
    sheet.insertRule(
      'header {' + ' z-index: 3 !important;' + ' }',
      sheet.cssRules.length,
    );
    sheet.insertRule(
      '.header-content-container > *, #options-login-box, #back-button {' +
        ' padding-left: 0.25rem;' +
        ' padding-right: 0.25rem;' +
        ' border-radius: 16px;' +
        ' height: 2.5rem;' +
        ' display: flex;' +
        ' justify-content: center;' +
        ' align-items: center;' +
        ' }',
      sheet.cssRules.length,
    );
    sheet.insertRule(
      '.userActivityIcon {' + ' margin-top: -0.5rem;' + ' }',
      sheet.cssRules.length,
    );
    sheet.insertRule(
      '.header .oldtypo-h2, .header .oldtypo-h2 + span {' + ' }',
      sheet.cssRules.length,
    );
    sheet.insertRule(
      '#footer_rescale {' + ' display: none !important;' + ' }',
      sheet.cssRules.length,
    );
    sheet.insertRule(
      'div.main_container, app-header > .mat-toolbar {' +
        ' background-color: unset !important;' +
        ' box-shadow: none; !important;' +
        ' color: var(--tag-cloud-inverted-background) !important;' +
        ' }',
      sheet.cssRules.length,
    );
  }

  private doDraw(
    parentElement: HTMLDivElement,
    parentWidth: number,
    parentHeight: number,
  ) {
    const timeInMs = 500;
    const interval = this.parameters.delayWord;
    parentElement.style.setProperty('--fadeInTime', timeInMs + 'ms');
    const scalar = this.createMapper(parentWidth, parentHeight);
    const mapper = (info: PositionInformation, op: 'x' | 'y'): number => {
      let v: number;
      let half: number;
      if (op === 'x') {
        v = info.origin[0];
        half = info.position.width / 2;
      } else {
        v = info.origin[1];
        half = info.position.height / 2;
      }
      return (v + half) * scalar - half;
    };
    this._elements.forEach((e, i) => {
      e.element.style.display = e.visible ? '' : 'none';
      if (!e.visible) {
        return;
      }
      e.element.style.setProperty('--offset-scale', scalar.toFixed(2));
      e.element.style.setProperty(
        '--pos-x',
        mapper(e.buildInformation, 'x') + parentWidth + 'px',
      );
      e.element.style.setProperty(
        '--pos-y',
        mapper(e.buildInformation, 'y') + parentHeight + 'px',
      );
      e.element.dataset['index'] = String(i);
    });
    const newElements = this._elements.filter(
      (e) => !e.element.classList.contains('visible') && e.visible,
    );
    let index = 0;
    const intervalId = setInterval(() => {
      if (index >= newElements.length) {
        clearInterval(intervalId);
        return;
      }
      newElements[index++].element.classList.add('visible');
    }, interval);
  }

  private createMapper(parentWidth: number, parentHeight: number): number {
    let minX = parentWidth;
    let minY = parentHeight;
    let maxX = -parentWidth;
    let maxY = -parentHeight;
    this._elements.forEach((e) => {
      if (!e.visible) {
        return;
      }
      const [x, y] = e.buildInformation.origin;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    });
    const scalar = Math.min(
      parentWidth / Math.abs(minX),
      parentWidth / Math.abs(maxX),
      parentHeight / Math.abs(minY),
      parentHeight / Math.abs(maxY),
    );
    return scalar * 0.8;
  }
}
