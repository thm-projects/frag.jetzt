import { Injectable } from '@angular/core';
import { NotificationService } from '../util/notification.service';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageShareService {

<<<<<<< HEAD
  constructor(private notficiationService: NotificationService) {
    window.addEventListener('message', this.messageHandler, false);

    this.notficiationService.show("hey");
=======
  constructor() {
    window.addEventListener('message', this.messageHandler, false);
>>>>>>> parent of d2d5c097... Adds strinigfy/parse to parse JSON but stringify data to work with
  }

  messageHandler(event) {
    const { action, key, value} = event.data;
<<<<<<< HEAD
    if (action == 'save') {
      window.localStorage.setItem(key, JSON.stringify(value));
    } else if (action == 'get') {
      event.source.postMessage({
        action: 'returnData',
        key,
        JSON.parse(window.localStorage.getItem(key))
      }, '*')
=======
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
>>>>>>> parent of d2d5c097... Adds strinigfy/parse to parse JSON but stringify data to work with
    }
  }
}
