export enum LivepollTemplate {
  Character,
  Symbol
}

export interface LivepollTemplateContext {
  kind: LivepollTemplate;
  name: string;
  isPlain: boolean;
  translate: boolean;
  translatePrefix?: string;
  symbols: string[];
}

export const templateContext: LivepollTemplateContext[] = [
  {
    kind: LivepollTemplate.Character,
    isPlain: true,
    name: 'character',
    translate: false,
    symbols: ['A', 'B', 'C', 'D']
  },
  {
    kind: LivepollTemplate.Symbol,
    isPlain: false,
    name: 'symbol',
    translate: false,
    symbols: ['sentiment_very_satisfied', 'sentiment_satisfied', 'sentiment_neutral', 'sentiment_very_dissatisfied']
  },
  {
    kind: LivepollTemplate.Character,
    isPlain: true,
    name: 'agreement',
    translate: true,
    translatePrefix: 'agree-',
    symbols: ['very-negative', 'negative', 'neutral', 'positive', 'very-positive']
  }
];

