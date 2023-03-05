import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface LivepollSessionCreateAPI  {
  template: string;
  title: string | null;
  resultVisible: boolean;
  viewsVisible: boolean;
  roomId: string;
}

@Injectable({
  providedIn: 'root',
})
export class LivepollService {
  constructor(public readonly http: HttpClient) {}

  create(livepoll: LivepollSessionCreateAPI) {
    this.http.post(
        '/api/livepoll/session',
        livepoll,
        { headers: { 'Content-Type': 'application/json' } },
      )
      .subscribe((x) => {
        console.log(x);
      });
  }
}
