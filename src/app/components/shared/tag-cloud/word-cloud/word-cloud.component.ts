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
import { CloudData } from 'angular-tag-cloud-module';
import { Matrix } from '../../../../utils/Matrix';

export interface WordMeta {
  text: string;
  weight: number;
}

interface BuildInformation {
  position: [x: number, y: number, width: number, height: number, midX: number, midY: number];
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
  @Input() keywords: CloudData[];
  @Input() weightClasses = 10;
  @Input() maxRotationInDegrees = 90;
  @Input() weightClassType = WeightClassType.lowest;
  private _elements: ActiveWord<T>[] = [];
  private _cssStyleElement: HTMLStyleElement;

  constructor(private renderer2: Renderer2) {
  }

  private static getIndexForSortedArray<K>(array: K[], value: number, valueMapper: (x: K) => number) {
    let low = 0;
    let high = array.length;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (valueMapper(array[mid]) < value) {
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
  }

  ngOnDestroy() {
    this._cssStyleElement.remove();
  }

  ngOnChanges(changes: SimpleChanges) {
    const changeKeywords = changes.keywords;
    // rebuilt entire cloud
    /*for (const activeWord of this._elements) {
      activeWord.element.remove();
    }*/
    //this._elements.length = 0;
    const data = changeKeywords.currentValue as CloudData[];
    if (data.length < 1) {
      return;
    }
    let min = data[0].weight;
    let max = data[0].weight;
    for (const dataEntry of data) {
      min = Math.min(min, dataEntry.weight);
      max = Math.max(max, dataEntry.weight);
    }
    const isSame = Math.abs(max - min) <= Number.EPSILON;
    let defaultWeightClass;
    if (this.weightClassType === WeightClassType.lowest) {
      defaultWeightClass = 0;
    } else if (this.weightClassType === WeightClassType.highest) {
      defaultWeightClass = this.weightClasses;
    } else {
      defaultWeightClass = Math.round(this.weightClasses / 2);
    }
    for (const dataEntry of data) {
      this.addKeyword({
          weight: dataEntry.weight,
          text: dataEntry.text
        } as T,
        isSame ? defaultWeightClass : Math.round((dataEntry.weight - min) * this.weightClasses / (max - min)));
    }
  }

  private addKeyword(data: T, weightClass: number): void {
    const index = WordCloudComponent.getIndexForSortedArray(this._elements, data.weight, x => x.meta.weight);
    const elem = this.renderer2.createElement('span');
    elem.innerText = data.text;
    elem.classList.add('test-' + weightClass);
    elem.dataset.index = index;
    const newValue = {
      element: elem,
      meta: data,
      weightClass,
      buildInformation: {
        position: [0, 0, 0, 0, 0, 0]
      }
    } as ActiveWord<T>;
    this._elements.splice(index, 0, newValue);
    this.wordCloud.nativeElement.appendChild(elem);
    this.findPlaceInCloud(index);
    for (let i = index + 1; i < this._elements.length; ++i) {
      this.findPlaceInCloud(i);
    }
  }

  private positionElement(word: ActiveWord<T>, parentWidthHalf: number, parentHeightHalf: number) {
    const [x, y] = word.buildInformation.position;
    const angle = Math.atan2(y, x);
    const matrix = Matrix.translateIn3D(parentWidthHalf, parentHeightHalf)
      .multiply(Matrix.rotateAroundZin3D(-angle))
      .multiply(Matrix.translateIn3D(Math.sqrt(x * x + y * y)))
      .multiply(Matrix.rotateAroundZin3D(angle));
    word.element.style.transform = 'matrix3d(' + matrix.transpose().data.join() + ')';
  }

  private findPlaceInCloud(index: number): boolean {
    const computed = this._elements[index].element.getBoundingClientRect();
    const elemWidth = computed.width;
    const elemWidthHalf = computed.width / 2;
    const elemHeight = computed.height;
    const elemHeightHalf = computed.height / 2;
    const parentRect = this.wordCloud.nativeElement.getBoundingClientRect();
    const parentWidth = parentRect.width / 2;
    const parentHeight = parentRect.height / 2;
    if (index === 0) {
      this._elements[0].buildInformation.position = [-elemWidthHalf, -elemHeightHalf, elemWidth, elemHeight, 0, 0];
      this.positionElement(this._elements[0], parentWidth, parentHeight);
      return true;
    }
    let bestPos = [0, 0];
    let bestDistSquared = null;
    for (let i = 0; i < index; ++i) {
      const [x, y, width, height, midX, midY] = this._elements[i].buildInformation.position;
      //top
      let newX = midX - elemWidthHalf;
      let newY = y - elemHeight;
      if (newY >= -parentHeight && !this.isColliding(newX, newY, elemWidth, elemHeight, index)) {
        const newMid = [midX, midY - elemHeight];
        const size = newMid[0] * newMid[0] + newMid[1] * newMid[1];
        if (!bestDistSquared || size < bestDistSquared) {
          bestPos = newMid;
          bestDistSquared = size;
        }
      }
      //bottom
      newY = y + height;
      if (newY + elemHeight <= parentHeight && !this.isColliding(newX, newY, elemWidth, elemHeight, index)) {
        const newMid = [midX, midY + elemHeight];
        const size = newMid[0] * newMid[0] + newMid[1] * newMid[1];
        if (!bestDistSquared || size < bestDistSquared) {
          bestPos = newMid;
          bestDistSquared = size;
        }
      }
      //right
      newX = x + width;
      newY = midY - elemHeightHalf;
      if (newX + elemWidth <= parentWidth && !this.isColliding(newX, newY, elemWidth, elemHeight, index)) {
        const newMid = [newX + elemWidthHalf, midY];
        const size = newMid[0] * newMid[0] + newMid[1] * newMid[1];
        if (!bestDistSquared || size < bestDistSquared) {
          bestPos = newMid;
          bestDistSquared = size;
        }
      }
      //left
      newX = x - elemWidth;
      if (newX >= -parentWidth && !this.isColliding(newX, newY, elemWidth, elemHeight, index)) {
        const newMid = [newX + elemWidthHalf, midY];
        const size = newMid[0] * newMid[0] + newMid[1] * newMid[1];
        if (!bestDistSquared || size < bestDistSquared) {
          bestPos = newMid;
          bestDistSquared = size;
        }
      }
    }
    if (bestDistSquared !== null) {
      this._elements[index].buildInformation.position = [
        bestPos[0] - elemWidthHalf, bestPos[1] - elemHeightHalf, elemWidth, elemHeight, bestPos[0], bestPos[1]
      ];
      this.positionElement(this._elements[index], parentWidth, parentHeight);
      return true;
    }
    return false;
  }

  private isColliding(x: number, y: number, width: number, height: number, endIndex: number): boolean {
    const endX = x + width;
    const endY = y + height;
    for (let i = 0; i < endIndex; ++i) {
      const [elemX, elemY, elemWidth, elemHeight] = this._elements[i].buildInformation.position;
      const collidesInX = elemX <= x && elemX + elemWidth > x || elemX > x && elemX < endX;
      const collidesInY = elemY <= y && elemY + elemHeight > y || elemY > y && elemY < endY;
      if (collidesInX && collidesInY) {
        return true;
      }
    }
    return false;
  }

  /*
  changed weighting/changed name => remove & add
  add => search place and add
  remove => remove and redraw
  min/max change => rebuilt cloud? => scale cloud and continue
   */

}
