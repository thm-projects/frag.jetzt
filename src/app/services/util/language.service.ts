import { EventEmitter, Injectable } from '@angular/core';


@Injectable()

export class LanguageService {
  public readonly langEmitter = new EventEmitter<string>();
}
