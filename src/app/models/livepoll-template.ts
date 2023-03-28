export enum LivepollTemplate {
  AB = 'AB',
  ABCD = 'ABCD',
  Symbol = 'Symbol',
  Agree = 'Agree',
  Frequency = 'Frequency',
  Quality = 'Quality',
  Feedback = 'Feedback',
  YesNo = 'YesNo',
  Feedback2 = 'Feedback2',
  Feedback3 = 'Feedback3',
}

export enum LivepollGroupKind {
  MultipleChoice,
  LikertScale,
  Mood,
  Feedback,
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
  [LivepollTemplate.ABCD]: {
    kind: LivepollTemplate.ABCD,
    isPlain: true,
    name: 'ABCD',
    translate: false,
    symbols: ['A', 'B', 'C', 'D'],
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
  [LivepollTemplate.Feedback]: {
    kind: LivepollTemplate.Feedback,
    isPlain: true,
    name: 'feedback-multi',
    translate: true,
    reverse: false,
    length: 6,
    style: defaultTemplateStyle,
    isGrid: false,
  },
  [LivepollTemplate.Feedback2]: {
    kind: LivepollTemplate.Feedback2,
    isPlain: true,
    name: 'feedback-multi-2',
    translate: true,
    reverse: false,
    length: 6,
    style: defaultTemplateStyle,
    isGrid: false,
  },
  [LivepollTemplate.Feedback3]: {
    kind: LivepollTemplate.Feedback3,
    isPlain: true,
    name: 'feedback-multi-3',
    translate: true,
    reverse: true,
    length: 4,
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
    templateEntries[LivepollTemplate.ABCD],
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
  [LivepollGroupKind.Feedback]: [
    templateEntries[LivepollTemplate.Feedback],
    templateEntries[LivepollTemplate.Feedback2],
    templateEntries[LivepollTemplate.Feedback3],
  ],
};

export const livepollTemplateOrder: { [key in LivepollGroupKind]: number } = {
  [LivepollGroupKind.MultipleChoice]: 0,
  [LivepollGroupKind.LikertScale]: 1,
  [LivepollGroupKind.Mood]: 3,
  [LivepollGroupKind.Feedback]: 2,
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
