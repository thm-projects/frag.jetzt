import {
  Component,
  ElementRef,
  Input,
  OnChanges, OnDestroy,
  OnInit,
  Renderer2,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { FontInfoService } from '../../../../services/util/font-info.service';

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

@Component({
  selector: 'app-word-cloud',
  templateUrl: './word-cloud.component.html',
  styleUrls: ['./word-cloud.component.scss']
})
export class WordCloudComponent<T extends WordMeta> implements OnInit, OnChanges, OnDestroy {

  @ViewChild('wordCloud') wordCloud: ElementRef<HTMLDivElement>;
  @Input() keywords: T[];
  @Input() weightClasses = 10;
  @Input() maxRotationInDegrees = 90;
  @Input() weightClassType = WeightClassType.lowest;
  private _elements: ActiveWord<T>[] = [];
  private _cssStyleElement: HTMLStyleElement;

  constructor(private renderer2: Renderer2,
              private fontInfoService: FontInfoService) {
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
    this.fontInfoService.waitTillFontLoaded('Dancing Script').subscribe(font => console.log(font));
  }

  ngOnDestroy() {
    this._cssStyleElement.remove();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.redraw();
  }

  redraw() {
    if (!this.wordCloud || !this.wordCloud.nativeElement) {
      return;
    }
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
    const parentRect = this.wordCloud.nativeElement.getBoundingClientRect();
    const parentWidth = parentRect.width / 2;
    const parentHeight = parentRect.height / 2;
    this._elements = this._elements.filter((word, i) => {
      const weightClass = isSame ?
        defaultWeightClass :
        Math.round((max - word.meta.weight) * (this.weightClasses - 1) / (max - min));
      word.element.classList.value = 'test-' + weightClass;
      word.weightClass = weightClass;
      if (this.findPlaceInCloud(i, parentWidth, parentHeight)) {
        return true;
      }
      word.element.remove();
      return false;
    });
    this._elements.forEach(e => {
      const [x, y] = e.buildInformation.position;
      e.element.style.setProperty('--pos-x', (x + parentWidth) + 'px');
      e.element.style.setProperty('--pos-y', (y + parentHeight) + 'px');
    });
  }

  private calculateChanges(data: T[]): [min: number, max: number] {
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
      newElements.push({
        element: elem,
        meta: dataEntry,
        weightClass: null,
        buildInformation: {
          position: [0, 0, 0, 0],
          hasNeighbour: [false, false, false, false]
        }
      });
    }
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
    const computed = this._elements[index].element.getBoundingClientRect();
    const elemWidth = computed.width;
    const elemWidthHalf = computed.width / 2;
    const elemHeight = computed.height;
    const elemHeightHalf = computed.height / 2;
    if (index === 0) {
      this._elements[0].buildInformation.position = [-elemWidthHalf, -elemHeightHalf, elemWidth, elemHeight];
      return true;
    }
    let bestPos = [0, 0];
    let bestDistSquared = null;
    let currentIndex = null;
    const aspectSquared = Math.pow(parentHeight / parentWidth, 2);
    const checkBetter = (x: number, y: number): boolean => {
      if (!this.isColliding(x, y, elemWidth, elemHeight, index, parentWidth, parentHeight)) {
        const newMid = [x + elemWidthHalf, y + elemHeightHalf];
        const size = newMid[0] * newMid[0] * aspectSquared + newMid[1] * newMid[1];
        if (!bestDistSquared || size < bestDistSquared) {
          bestPos = newMid;
          bestDistSquared = size;
          return true;
        }
      }
      return false;
    };
    for (let i = 0; i < index; ++i) {
      const { hasNeighbour, position } = this._elements[i].buildInformation;
      const [x, y, width, height] = position;
      const midX = x + width / 2;
      const midY = y + height / 2;
      //top
      let newX = midX - elemWidthHalf;
      let newY = y - elemHeight;
      if (!hasNeighbour[0] && checkBetter(newX, newY)) {
        currentIndex = [i, 0];
      }
      //bottom
      newY = y + height;
      if (!hasNeighbour[1] && checkBetter(newX, newY)) {
        currentIndex = [i, 1];
      }
      //right
      newX = x + width;
      newY = midY - elemHeightHalf;
      if (!hasNeighbour[2] && checkBetter(newX, newY)) {
        currentIndex = [i, 2];
      }
      //left
      newX = x - elemWidth;
      if (!hasNeighbour[3] && checkBetter(newX, newY)) {
        currentIndex = [i, 3];
      }
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
