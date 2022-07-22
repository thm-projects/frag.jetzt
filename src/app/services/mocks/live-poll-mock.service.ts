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
  closed: boolean;
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

  private session: LivePollSession;

  constructor(private r: RoomDataService) {
    this.session={
      hasActiveLivePoll: false,
      currentLivePoll: null,
      previousLivePoll: null
    };
  }

  public getSessionData(room: Room): Observable<LivePollSession> {
    return of<LivePollSession>(this.deepCopy());
  }

  public start(): Observable<LivePollSession> {
    this.session.hasActiveLivePoll=true;
    return of<LivePollSession>(this.deepCopy());
  }

  public updateSessionData(session: LivePollSession): Observable<LivePollSession> {
    Object.keys(session).forEach(k=>this.session[k]=session[k]);
    return of<LivePollSession>(this.deepCopy());
  }

  public defaultSymbolSet(): [string, LivePollSymbolSet][] {
    return predefinedSymbolSets;
  }

  private deepCopy(): LivePollSession{
    return JSON.parse(JSON.stringify(this.session));
  }

}
