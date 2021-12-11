import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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

  waitTillFontLoaded(fontFamily: string): Observable<FontFace> {
    return new Observable(sub => {
      (document as any).fonts.ready.then((faceSet) => {
        const notLoadedFonts: FontFace[] = [];
        for (const face of faceSet.keys()) {
          const font = face as FontFace;
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
      });
    });
  }
}
