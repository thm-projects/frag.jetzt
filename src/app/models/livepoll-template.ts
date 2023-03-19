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
    transform: 'scale(1.5)',
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
  [LivepollTemplate.Character]: {
    kind: LivepollTemplate.Character,
    isPlain: true,
    name: 'character',
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
      'sentiment_very_dissatisfied',
      'sentiment_neutral',
      'sentiment_satisfied',
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
    reverse: true,
    length: 5,
    style: defaultTemplateStyle,
    isGrid: true,
  },
  [LivepollTemplate.Frequency]: {
    kind: LivepollTemplate.Frequency,
    isPlain: true,
    name: 'frequency-multi',
    translate: true,
    reverse: true,
    length: 5,
    style: defaultTemplateStyle,
    isGrid: true,
  },
  [LivepollTemplate.YesNo]: {
    kind: LivepollTemplate.YesNo,
    isPlain: false,
    name: 'agree-binary',
    translate: false,
    reverse: true,
    symbols: ['thumb_down', 'thumb_up'],
    style: defaultTemplateStyle,
    isGrid: true,
  },
  [LivepollTemplate.Scale]: {
    kind: LivepollTemplate.Scale,
    isPlain: true,
    name: 'scale-multi',
    translate: true,
    reverse: true,
    length: 4,
    style: defaultTemplateStyle,
    isGrid: true,
  },
};

export const groupEntries: EachOfGroup<LivepollGroupKind> = {
  [LivepollGroupKind.Frequency]: [templateEntries[LivepollTemplate.Frequency]],
  [LivepollGroupKind.Value]: [templateEntries[LivepollTemplate.Scale]],
  [LivepollGroupKind.Agreement]: [templateEntries[LivepollTemplate.Agree]],
  [LivepollGroupKind.Misc]: [
    templateEntries[LivepollTemplate.Character],
    templateEntries[LivepollTemplate.YesNo],
    templateEntries[LivepollTemplate.Symbol],
  ],
};

export const livepollTemplateOrder: { [key in LivepollGroupKind]: number } = {
  [LivepollGroupKind.Frequency]: 0,
  [LivepollGroupKind.Value]: 1,
  [LivepollGroupKind.Agreement]: 2,
  [LivepollGroupKind.Misc]: 3,
};

export const templateContext: LivepollTemplateContext[] = Object.keys(
  templateEntries,
).map((entry) => templateEntries[entry]);

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
