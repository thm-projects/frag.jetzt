import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TabCommunicationService {
  messages$ = new Subject<string>();
  readonly messageType: 'broadcast' | 'storage';
  readonly sendMessage: (message: string) => void;

  constructor() {
    this.listenDefaultEvents();
    if (typeof window.BroadcastChannel !== 'function') {
      this.messageType = 'storage';
      window.addEventListener('storage', (e) => {
        if (e.storageArea !== sessionStorage) return;
        if (e.key !== 'tab-communication') return;
        this.messages$.next(e.newValue);
      });
      this.sendMessage = (message: string) =>
        sessionStorage.setItem('tab-communication', message);
      return;
    }
    this.messageType = 'broadcast';
    const channel = new BroadcastChannel('tab-communication');
    channel.addEventListener('message', (e) => {
      if (typeof e.data !== 'string') return;
      this.messages$.next(e.data);
    });
    this.sendMessage = (message: string) => channel.postMessage(message);
  }

  private listenDefaultEvents() {
    this.messages$.subscribe((msg) => {
      if (msg === 'close-window') {
        window.close();
        location.replace('about:blank');
      }
    });
  }
}
