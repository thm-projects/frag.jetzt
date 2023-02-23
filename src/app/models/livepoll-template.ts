export enum LivepollTemplate {
  Character,
  Symbol,
  Agree
}

export interface LivepollNode<E extends LivepollTemplate> {
  kind: E;
  name: string;
  isPlain: boolean;
  translate: boolean;
  symbols?: string[];
  length?: number;
  reverse?: boolean;
}

export type LivepollTemplateContext = LivepollNode<LivepollTemplate>;

type EachOf<E extends LivepollTemplate, T extends LivepollNode<E>> = { [E in T['kind']]: LivepollNode<E> };

export const templateEntries: EachOf<LivepollTemplate, LivepollNode<LivepollTemplate>> = {
  [LivepollTemplate.Symbol]: {
    kind: LivepollTemplate.Symbol,
    isPlain: false,
    name: 'symbol',
    translate: false,
    reverse: true,
    symbols: ['sentiment_very_dissatisfied', 'sentiment_neutral', 'sentiment_satisfied', 'sentiment_very_satisfied']
  },
  [LivepollTemplate.Character]: {
    kind: LivepollTemplate.Character,
    isPlain: true,
    name: 'character',
    translate: false,
    symbols: ['A', 'B', 'C', 'D']
  },
  [LivepollTemplate.Agree]: {
    kind: LivepollTemplate.Agree,
    isPlain: true,
    name: 'agree',
    translate: true,
    reverse: true,
    length: 5
  }
};

export const templateContext: LivepollTemplateContext[] = Object.keys(templateEntries).map(entry => templateEntries[entry]);


