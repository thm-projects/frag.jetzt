import { Injectable } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class CachedSanitizerService {

  private _trustCache: { [key: string]: SafeResourceUrl } = {};

  constructor(
    private domSanitizer: DomSanitizer,
  ) {
  }

  trust(url: string): SafeResourceUrl {
    const safeUrl = this._trustCache[url];
    if (safeUrl) {
      return safeUrl;
    }
    this._trustCache[url] = this.domSanitizer.bypassSecurityTrustResourceUrl(url);
    return this._trustCache[url];
  }
}
