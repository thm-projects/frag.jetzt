export enum LivepollTemplate {
  Character = 'Character',
  Symbol = 'Symbol',
  Agree = 'Agree',
  Frequency = 'Frequency',
  YesNo = 'YesNo',
  Scale = 'Scale',
}

export enum LivepollGroupKind {
  Agreement,
  Value,
  Frequency,
  Misc,
}

export interface LivepollNode<E extends LivepollTemplate> {
  isGrid: boolean;
  kind: E;
  name: string;
  isPlain: boolean;
  translate: boolean;
  symbols?: string[];
  length?: number;
  reverse?: boolean;
}

export type LivepollTemplateContext = LivepollNode<LivepollTemplate>;

type EachOfTemplate<E extends LivepollTemplate, T extends LivepollNode<E>> = {
  [E in T['kind']]: LivepollNode<E>;
};
type EachOfGroup<E extends LivepollGroupKind> = {
  [E in LivepollGroupKind]: LivepollTemplateContext[];
};

export const templateEntries: EachOfTemplate<
  LivepollTemplate,
  LivepollNode<LivepollTemplate>
> = {
  [LivepollTemplate.Character]: {
    kind: LivepollTemplate.Character,
    isPlain: true,
    name: 'character',
    translate: false,
    symbols: ['A', 'B', 'C', 'D'],
    isGrid: true,
  },
  [LivepollTemplate.Symbol]: {
    kind: LivepollTemplate.Symbol,
    isPlain: false,
    name: 'symbol',
    translate: false,
    reverse: true,
    symbols: [
      'sentiment_very_dissatisfied',
      'sentiment_neutral',
      'sentiment_satisfied',
      'sentiment_very_satisfied',
    ],
    isGrid: true,
  },
  [LivepollTemplate.Agree]: {
    kind: LivepollTemplate.Agree,
    isPlain: true,
    name: 'agree-multi',
    translate: true,
    reverse: true,
    length: 5,
    isGrid: false,
  },
  [LivepollTemplate.Frequency]: {
    kind: LivepollTemplate.Frequency,
    isPlain: true,
    name: 'frequency-multi',
    translate: true,
    reverse: true,
    length: 5,
    isGrid: false,
  },
  [LivepollTemplate.YesNo]: {
    kind: LivepollTemplate.YesNo,
    isPlain: false,
    name: 'agree-binary',
    translate: false,
    reverse: true,
    symbols: ['thumb_down', 'thumb_up'],
    isGrid: true,
  },
  [LivepollTemplate.Scale]: {
    kind: LivepollTemplate.Scale,
    isPlain: true,
    name: 'scale-multi',
    translate: true,
    reverse: true,
    length: 4,
    isGrid: true,
  },
};

export const groupEntries: EachOfGroup<LivepollGroupKind> = {
  [LivepollGroupKind.Frequency]: [templateEntries[LivepollTemplate.Frequency]],
  [LivepollGroupKind.Value]: [templateEntries[LivepollTemplate.Scale]],
  [LivepollGroupKind.Agreement]: [templateEntries[LivepollTemplate.Agree]],
  [LivepollGroupKind.Misc]: [
    templateEntries[LivepollTemplate.Symbol],
    templateEntries[LivepollTemplate.Character],
    templateEntries[LivepollTemplate.YesNo],
  ],
};

export const templateContext: LivepollTemplateContext[] = Object.keys(
  templateEntries,
).map((entry) => templateEntries[entry]);

export const templateGroups: [string, LivepollTemplateContext[]][] =
  Object.keys(groupEntries).map((entry) => [
    LivepollGroupKind[entry].toLowerCase(),
    groupEntries[entry],
  ]);
