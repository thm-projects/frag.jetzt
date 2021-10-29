import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageShareService {

  constructor() {
    window.addEventListener('message', this.messageHandler.bind(this), false);
  }

  messageHandler(event) {
    const { action, key, value} = JSON.parse(event.data);
    if (action === 'save') {
      window.localStorage.setItem(key, JSON.stringify(value));
    } else if (action === 'get') {
      const obj = JSON.parse(window.localStorage.getItem(key));
      if(obj !== null) {
        event.source.postMessage(JSON.stringify({
          action: 'returnData',
          key,
          obj
        }), '*');
      }
    }
  }
}
