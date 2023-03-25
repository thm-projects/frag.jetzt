export enum LivepollTemplate {
  AB = 'AB',
  ABC = 'ABC',
  ABCD = 'ABCD',
  ABCDE = 'ABCDE',
  ABCDEF = 'ABCDEF',
  Symbol = 'Symbol',
  Agree = 'Agree',
  Frequency = 'Frequency',
  Quality = 'Quality',
  YesNo = 'YesNo',
}

export enum LivepollGroupKind {
  MultipleChoice,
  LikertScale,
  Mood,
}

export type StyleProperties = {
  [key in keyof Partial<CSSStyleDeclaration>]: any;
};

export interface LivepollStyleProperties {
  matIcon?: StyleProperties;
  plainIcon?: StyleProperties;
  text?: StyleProperties;
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
  style?: LivepollStyleProperties;
  order?: number;
}

export type LivepollTemplateContext = LivepollNode<LivepollTemplate>;
export type LivepollGroupContext = LivepollGroupNode<LivepollGroupKind>;

type EachOfTemplate<E extends LivepollTemplate, T extends LivepollNode<E>> = {
  [E in T['kind']]: LivepollNode<E>;
};
type EachOfGroup<E extends LivepollGroupKind> = {
  [E in LivepollGroupKind]: LivepollTemplateContext[];
};

export interface LivepollGroupNode<E extends LivepollGroupKind> {
  kind: E;
  key: string;
  order: number;
  templates: LivepollTemplateContext[];
}

const defaultTemplateStyle: LivepollStyleProperties = {
  matIcon: {
    transform: 'scale(1.7)',
  },
  plainIcon: {
    fontSize: '1em',
  },
  text: {
    fontSize: '1em',
  },
};

export const templateEntries: EachOfTemplate<
  LivepollTemplate,
  LivepollNode<LivepollTemplate>
> = {
  [LivepollTemplate.AB]: {
    kind: LivepollTemplate.AB,
    isPlain: true,
    name: 'AB',
    translate: false,
    symbols: ['A', 'B'],
    style: defaultTemplateStyle,
    isGrid: true,
  },
  [LivepollTemplate.ABC]: {
    kind: LivepollTemplate.ABC,
    isPlain: true,
    name: 'ABC',
    translate: false,
    symbols: ['A', 'B', 'C'],
    style: defaultTemplateStyle,
    isGrid: true,
  },
  [LivepollTemplate.ABCD]: {
    kind: LivepollTemplate.ABCD,
    isPlain: true,
    name: 'ABCD',
    translate: false,
    symbols: ['A', 'B', 'C', 'D'],
    style: defaultTemplateStyle,
    isGrid: true,
  },
  [LivepollTemplate.ABCDE]: {
    kind: LivepollTemplate.ABCDE,
    isPlain: true,
    name: 'ABCDE',
    translate: false,
    symbols: ['A', 'B', 'C', 'D', 'E'],
    style: defaultTemplateStyle,
    isGrid: true,
  },
  [LivepollTemplate.ABCDEF]: {
    kind: LivepollTemplate.ABCDEF,
    isPlain: true,
    name: 'ABCDEF',
    translate: false,
    symbols: ['A', 'B', 'C', 'D', 'E', 'F'],
    style: defaultTemplateStyle,
    isGrid: true,
  },
  [LivepollTemplate.Symbol]: {
    kind: LivepollTemplate.Symbol,
    isPlain: false,
    name: 'symbol',
    translate: false,
    reverse: true,
    symbols: [
      'mood_bad',
      'sentiment_very_dissatisfied',
      'sentiment_satisfied_alt',
      'sentiment_very_satisfied',
    ],
    style: defaultTemplateStyle,
    isGrid: true,
  },
  [LivepollTemplate.Agree]: {
    kind: LivepollTemplate.Agree,
    isPlain: true,
    name: 'agree-multi',
    translate: true,
    reverse: false,
    length: 5,
    style: defaultTemplateStyle,
    isGrid: false,
  },
  [LivepollTemplate.Frequency]: {
    kind: LivepollTemplate.Frequency,
    isPlain: true,
    name: 'frequency-multi',
    translate: true,
    reverse: true,
    length: 4,
    style: defaultTemplateStyle,
    isGrid: true,
  },
  [LivepollTemplate.Quality]: {
    kind: LivepollTemplate.Quality,
    isPlain: true,
    name: 'quality-multi',
    translate: true,
    reverse: false,
    length: 6,
    style: defaultTemplateStyle,
    isGrid: true,
  },
  [LivepollTemplate.YesNo]: {
    kind: LivepollTemplate.YesNo,
    isPlain: false,
    name: 'agree-binary',
    translate: false,
    reverse: false,
    symbols: ['thumb_up', 'thumb_down'],
    style: defaultTemplateStyle,
    isGrid: true,
  },
};

export const groupEntries: EachOfGroup<LivepollGroupKind> = {
  [LivepollGroupKind.MultipleChoice]: [
    templateEntries[LivepollTemplate.AB],
    templateEntries[LivepollTemplate.ABC],
    templateEntries[LivepollTemplate.ABCD],
    templateEntries[LivepollTemplate.ABCDE],
    templateEntries[LivepollTemplate.ABCDEF],
  ],
  [LivepollGroupKind.LikertScale]: [
    templateEntries[LivepollTemplate.Agree],
    templateEntries[LivepollTemplate.Frequency],
    templateEntries[LivepollTemplate.Quality],
  ],
  [LivepollGroupKind.Mood]: [
    templateEntries[LivepollTemplate.Symbol],
    templateEntries[LivepollTemplate.YesNo],
  ],
};

export const livepollTemplateOrder: { [key in LivepollGroupKind]: number } = {
  [LivepollGroupKind.MultipleChoice]: 0,
  [LivepollGroupKind.LikertScale]: 1,
  [LivepollGroupKind.Mood]: 2,
};

export const templateContext: LivepollTemplateContext[] = Object.keys(
  templateEntries,
).map((entry) => templateEntries[entry]);

/**
 * e.g.: Frequency
 *    templateEntries['Frequency']
 * or templateEntries[LivepollTemplate.Frequency]
 */
export const defaultLivepollTemplate: LivepollTemplateContext =
  templateEntries['Frequency'];

export const templateGroups: LivepollGroupContext[] = Object.keys(groupEntries)
  .map((entry) => ({
    key: LivepollGroupKind[entry].toLowerCase(),
    kind: LivepollGroupKind[entry],
    order: livepollTemplateOrder[entry],
    templates: (groupEntries[entry] as LivepollTemplateContext[]).sort(
      (a, b) => a.order - b.order,
    ),
  }))
  .sort((a, b) => b.order - a.order);
