import { Injectable } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';

export interface FontFace {
  ascentOverride?: string;
  descentOverride?: string;
  display: string;
  family: string;
  featureSettings: string;
  lineGapOverride?: string;
  readonly loaded: Promise<FontFace>;
  readonly status: 'unloaded' | 'loading' | 'loaded' | 'error';
  stretch: string;
  style: string;
  unicodeRange: string;
  variant?: string;
  variationSettings?: string;
  weight: string;

  load(): Promise<FontFace>;
}

@Injectable({
  providedIn: 'root'
})
export class FontInfoService {

  constructor() {
  }

  private static checkFontReady(
    faceSet: FontFaceSet, notLoadedFonts: FontFace[], sub: Subscriber<FontFace>, fontFamily: string
  ) {
    if (faceSet.check('1em ' + fontFamily)) {
      sub.next(null);
      sub.complete();
      return;
    }
    if (notLoadedFonts.length < 1) {
      sub.next(null);
      sub.complete();
    }
    notLoadedFonts.forEach(font => {
      font.loaded.then(_ => {
        if (!sub.closed) {
          sub.next(font);
          sub.complete();
        }
      });
    });
  }

  waitTillFontLoaded(fontFamily: string): Observable<FontFace> {
    return new Observable(sub => {
      const faceSet = (document as any).fonts;
      faceSet.ready.then(() => {
        const notLoadedFonts: FontFace[] = [];
        const iter: Iterator<FontFace> = faceSet.keys();
        let iterElem = iter.next();
        while (!iterElem.done) {
          const font = iterElem.value as FontFace;
          iterElem = iter.next();
          if (font.family !== fontFamily) {
            continue;
          }
          if (font.status === 'loaded') {
            sub.next(font);
            sub.complete();
            return;
          }
          notLoadedFonts.push(font);
        }
        FontInfoService.checkFontReady(faceSet, notLoadedFonts, sub, fontFamily);
      });
    });
  }
}
