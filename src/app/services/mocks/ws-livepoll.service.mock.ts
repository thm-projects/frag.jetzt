import { Injectable } from '@angular/core';
import {User} from '../../models/user';

@Injectable({
  providedIn: 'root'
})
export class WsLivepollServiceMock {

  constructor() { }

  send(i: number, user: User) {
    console.log(i,user);
  }
}
