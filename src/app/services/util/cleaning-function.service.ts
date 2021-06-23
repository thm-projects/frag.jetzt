import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CleaningFunctionService {
  regexKatex    = new RegExp('\\$[^$\\n ]+\\$|\\$\\$[^$\\n ]+\\$\\$','g');
  regexEmoji    = new RegExp('\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]', 'g');
  regexMarkdown = new RegExp('(?:__|[*#])|\\[(.+?)]\\((.+?)\\)', 'g');

  constructor(
  ) {}
  cleaningFunction(text: string): string {
    text = text.replace(this.regexKatex,'');
    text = text.replace(this.regexEmoji,'');
    text = text.replace(this.regexMarkdown,'');
    return text;
  }
}
