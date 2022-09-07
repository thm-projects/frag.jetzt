import { Injectable } from '@angular/core';
import { StartUpService } from '../util/start-up.service';
import { Observable, of } from 'rxjs';


@Injectable()
export class StartUpServiceMock extends StartUpService {

  isReady(): boolean {
    return true;
  }

  onReady(): Observable<unknown> {
    return of(true);
  }

}
