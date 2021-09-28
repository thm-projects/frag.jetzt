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

export interface ActiveWord<T extends WordMeta> {
  meta: T;
  weightClass: number;
  element: HTMLSpanElement;
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
  private angle = Math.PI / 2;
  private _cssStyleElement: HTMLStyleElement;

  constructor(private renderer2: Renderer2) {
  }

  private static getIndexForSortedArray(array, value) {
    let low = 0;
    let high = array.length;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (array[mid] < value) {
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
    const elem = this.wordCloud.nativeElement;
    const matrix = Matrix.translateIn3D(elem.clientWidth / 2, elem.clientHeight / 2)
      .multiply(Matrix.rotateAroundZin3D(-this.angle))
      .multiply(Matrix.translateIn3D(200, 0))
      .multiply(Matrix.rotateAroundZin3D(this.angle));
    this.angle += Math.PI / 2;
    matrix.log();
    const str = 'matrix3d(' + matrix.transpose().data.join() + ')';
    if (this._elements.length > 0) {
      for (const activeWord of this._elements) {
        activeWord.element.style.transform = str;
      }
      return;
    }
    for (const dataEntry of data) {
      this.addKeyword({
          weight: dataEntry.weight,
          text: dataEntry.text
        } as T,
        isSame ? defaultWeightClass : Math.round((dataEntry.weight - min) * this.weightClasses / (max - min)),
        str);
    }
  }

  private addKeyword(data: T, weightClass: number, matrix: string) {
    const elem = this.renderer2.createElement('span');
    elem.innerText = data.text;
    elem.classList.add('test-' + weightClass);
    elem.style.transform = matrix;
    this._elements.push({
      element: elem,
      meta: data,
      weightClass
    });
    this.wordCloud.nativeElement.appendChild(elem);
  }

  /*
  changed weighting/changed name => remove & add
  add => search place and add
  remove => remove and redraw
  min/max change => rebuilt cloud? => scale cloud and continue
   */

}
