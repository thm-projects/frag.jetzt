import { Injectable } from '@angular/core';
import { NotificationService } from '../util/notification.service';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageShareService {

  constructor(private notficiationService: NotificationService) {
    window.addEventListener('message', this.messageHandler, false);

    this.notficiationService.show("hey");
  }

  messageHandler(event) {
    const { action, key, value} = event.data;
    if (action === 'save') {
      window.localStorage.setItem(key, JSON.stringify(value));
    } else if (action === 'get') {
      const obj = JSON.parse(window.localStorage.getItem(key));
      if(obj !== null) {
        event.source.postMessage({
          action: 'returnData',
          key,
          obj
        }, '*');
      }
    }
  }
}
