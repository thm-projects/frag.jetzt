import {
  LivePollData,
  LivePollSymbolSet,
  LivePollSymbolType,
  predefinedSymbolSets
} from '../../../../services/mocks/live-poll-mock.service';

export class LivePollList implements LivePollData {
  name: string;
  symbolSet: LivePollSymbolSet;
  public list: LivePollEntry[];
  public sum: number = 0;
  public highest: number = 0;

  constructor() {
    this.list = [];
    for (let i = 0; i < 4; i++) {
      this.list.push(new LivePollEntry());
    }
    this.symbolSet = predefinedSymbolSets[0][1];
    this.propagate();
  }

  public propagate = () => {
    this.sum = this.list.map(x => x.value).reduce((x, y) => x + y);
    this.list.forEach((e, i) => {
      e.sum = this.sum;
      e.symbol = this.symbolSet.symbol[i];
      e.type = this.symbolSet.type;
    });
  };
}

export class LivePollEntry {
  public value: number = 0;
  public sum: number = 0;
  public symbol: string;
  public type: LivePollSymbolType;
}
