import {Injectable} from '@angular/core';
import {Room} from '../../models/room';
import {Observable, of} from 'rxjs';
import {RoomDataService} from '../util/room-data.service';
import {LivePollEntry, LivePollList} from '../../components/shared/live-poll/live-poll-entry/LivePollEntry';

export declare type LivePollSymbolType='ascii'|'materialIcon';

export const predefinedSymbolSets: [string, LivePollSymbolSet][] = [
  ['letter',{type:'ascii',symbol:'ABCD'.split('')}],
  ['number',{type:'ascii',symbol:'1234'.split('')}],
  ['sentiment',{type:'materialIcon',symbol:['sentiment_very_satisfied','sentiment_satisfied','sentiment_neutral','sentiment_dissatisfied']}]
];

export interface LivePollSymbolSet {
  type: LivePollSymbolType;
  symbol: string[];
}

export interface LivePollData {
  name: string;
  symbolSet: LivePollSymbolSet;
  list: LivePollEntry[];
  sum: number;
  highest: number;
}

export interface LivePollSession {
  hasActiveLivePoll: boolean;
  currentLivePoll: LivePollData;
  previousLivePoll: LivePollData;
}

@Injectable({
  providedIn: 'root'
})
export class LivePollMockService {

  constructor(private r: RoomDataService) {
  }

  public getSessionData(room: Room): Observable<LivePollSession> {
    return of<LivePollSession>({
      hasActiveLivePoll: false,
      currentLivePoll: null,
      previousLivePoll: null
    });
  }

  public updateSessionData(session: LivePollSession) {
  }

  public defaultSymbolSet(): [string, LivePollSymbolSet][] {
    return predefinedSymbolSets;
  }

}
