import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LivepollConfiguration } from '../../models/livepoll-configuration';

@Injectable({
  providedIn: 'root',
})
export class LivepollService {
  constructor(public readonly http: HttpClient) {}

  create(livepollConfiguration: LivepollConfiguration) {
    this.http
      .post(
        'api/livepoll/session',
        {
          viewsVisible: livepollConfiguration.viewsVisible,
          resultsVisible: livepollConfiguration.resultVisible,
          title: 'test',
          template: livepollConfiguration.template + '',
          active: true,
        },
        { headers: { 'Content-Type': 'application/json' } },
      )
      .subscribe((x) => {
        console.log(x);
      });
  }
}
