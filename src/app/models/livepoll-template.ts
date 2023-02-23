export enum LivepollTemplate {
  Character,
  Symbol,
  Agree,
  Frequency,
  YesNo,
}

export enum LivepollGroupKind {
  Agreement,
  Value,
  Frequency,
  Importance,
  Misc
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

type EachOfTemplate<E extends LivepollTemplate, T extends LivepollNode<E>> = { [E in T['kind']]: LivepollNode<E> };
type EachOfGroup<E extends LivepollGroupKind> = { [E in LivepollGroupKind]: LivepollTemplateContext[] };

export const templateEntries: EachOfTemplate<LivepollTemplate, LivepollNode<LivepollTemplate>> = {
  [LivepollTemplate.Character]: {
    kind: LivepollTemplate.Character,
    isPlain: true,
    name: 'character',
    translate: false,
    symbols: ['A', 'B', 'C', 'D']
  },
  [LivepollTemplate.Symbol]: {
    kind: LivepollTemplate.Symbol,
    isPlain: false,
    name: 'symbol',
    translate: false,
    reverse: true,
    symbols: ['sentiment_very_dissatisfied', 'sentiment_neutral', 'sentiment_satisfied', 'sentiment_very_satisfied']
  },
  [LivepollTemplate.Agree]: {
    kind: LivepollTemplate.Agree,
    isPlain: true,
    name: 'agree-multi',
    translate: true,
    reverse: true,
    length: 5
  },
  [LivepollTemplate.Frequency]: {
    kind: LivepollTemplate.Frequency,
    isPlain: true,
    name: 'frequency-multi',
    translate: true,
    reverse: true,
    length: 5
  },
  [LivepollTemplate.YesNo]: {
    kind: LivepollTemplate.YesNo,
    isPlain: false,
    name: 'agree-binary',
    translate: false,
    reverse: true,
    symbols: ['thumb_down', 'thumb_up']
  }
};

export const groupEntries: EachOfGroup<LivepollGroupKind> = {
  [LivepollGroupKind.Frequency]: [
    templateEntries[LivepollTemplate.Frequency]
  ],
  [LivepollGroupKind.Value]: [],
  [LivepollGroupKind.Importance]: [],
  [LivepollGroupKind.Agreement]: [
    templateEntries[LivepollTemplate.Agree]
  ],
  [LivepollGroupKind.Misc]: []
};

export const templateContext: LivepollTemplateContext[] = Object.keys(templateEntries).map(entry => templateEntries[entry]);


